/**
 * Spec 081 : sauvegarde locale quotidienne de MyStay.
 *   1. dump Postgres (schémas public, auth, storage), vérifié par pg_restore --list ;
 *   2. copie incrémentale des fichiers Supabase Storage ;
 *   3. rétention des dumps (30 jours).
 * Lecture seule côté Supabase (BR-01). Lancé par launchd via scripts/backup/backup.sh.
 */
import { execFile } from 'node:child_process'
import { lookup } from 'node:dns/promises'
import { appendFile, mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  dumpFileName,
  expiredDumps,
  planStorageDownloads,
  storageKey,
  waitForNetwork,
  type RemoteStorageFile,
  type StorageManifest,
} from './lib'

const run = promisify(execFile)

const BACKUP_DIR = process.env.MYSTAY_BACKUP_DIR || join(homedir(), 'Backups', 'mystay')
const RETENTION_DAYS = Number(process.env.MYSTAY_BACKUP_RETENTION_DAYS || 30)
// Spec 081 BR-06 : attente du réseau (réveil de maintenance sans réseau à 3 h).
const NETWORK_WAIT_MS = Number(process.env.MYSTAY_BACKUP_NETWORK_WAIT_MIN || 720) * 60_000
const NETWORK_CHECK_MS = 30_000
const DB_DIR = join(BACKUP_DIR, 'db')
const STORAGE_DIR = join(BACKUP_DIR, 'storage')
const LOG_DIR = join(BACKUP_DIR, 'logs')
const MANIFEST_PATH = join(STORAGE_DIR, '.manifest.json')

const startedAt = new Date()
const logFile = join(LOG_DIR, `backup-${dumpFileName(startedAt).slice(7, 17)}.log`)

async function log(message: string) {
  const line = `[${new Date().toISOString()}] ${message}`
  console.log(line)
  await appendFile(logFile, `${line}\n`)
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Variable ${name} absente (.env.local)`)
  return value
}

// Le mot de passe passe par PGPASSWORD : il n'apparaît ni dans la ligne de commande ni dans les journaux.
function databaseConnection(): { dbname: string; env: NodeJS.ProcessEnv } {
  const url = new URL(requireEnv('DIRECT_URL'))
  const password = decodeURIComponent(url.password)
  url.password = ''
  return { dbname: url.toString(), env: { ...process.env, PGPASSWORD: password } }
}

/** Masque toute URL de connexion Postgres dans un message. */
function redact(message: string): string {
  return message.replace(/postgres(?:ql)?:\/\/[^\s]+/g, 'postgresql://***')
}

async function backupDatabase(): Promise<string> {
  const target = join(DB_DIR, dumpFileName(startedAt))
  const partial = `${target}.partial`
  const connection = databaseConnection()
  await run('pg_dump', [
    '--format=custom',
    '--no-owner',
    '--no-privileges',
    '--schema=public',
    '--schema=auth',
    '--schema=storage',
    `--file=${partial}`,
    `--dbname=${connection.dbname}`,
  ], { maxBuffer: 64 * 1024 * 1024, env: connection.env })
  // AC-01-01 : l'archive doit être lisible avant d'être conservée.
  const { stdout } = await run('pg_restore', ['--list', partial], { maxBuffer: 64 * 1024 * 1024 })
  const entries = stdout.split('\n').filter(line => line && !line.startsWith(';')).length
  if (entries === 0) throw new Error('Archive vide ou illisible')
  await rename(partial, target)
  const { size } = await stat(target)
  await log(`Base : ${target} (${(size / 1024 / 1024).toFixed(1)} Mo, ${entries} objets)`)
  return target
}

async function listBucketFiles(supabase: SupabaseClient, bucket: string, prefix = ''): Promise<RemoteStorageFile[]> {
  const files: RemoteStorageFile[] = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } })
    if (error) throw new Error(`Liste ${bucket}/${prefix} : ${error.message}`)
    for (const item of data ?? []) {
      const path = prefix ? `${prefix}/${item.name}` : item.name
      if (item.id === null) {
        files.push(...await listBucketFiles(supabase, bucket, path))
      } else {
        const metadata = (item.metadata ?? {}) as { size?: number }
        files.push({ bucket, path, size: metadata.size ?? 0, updated_at: item.updated_at ?? item.created_at ?? '' })
      }
    }
    if (!data || data.length < 1000) return files
  }
}

async function backupStorage(): Promise<void> {
  const supabase = createClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) throw new Error(`Buckets : ${error.message}`)

  const manifest: StorageManifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8').catch(() => '{}'))
  const remote = (await Promise.all((buckets ?? []).map(bucket => listBucketFiles(supabase, bucket.id)))).flat()
  const downloads = planStorageDownloads(remote, manifest)
  let failures = 0

  for (const file of downloads) {
    const { data, error: downloadError } = await supabase.storage.from(file.bucket).download(file.path)
    if (downloadError || !data) {
      failures += 1
      await log(`Échec téléchargement ${storageKey(file)} : ${downloadError?.message ?? 'vide'}`)
      continue
    }
    const destination = join(STORAGE_DIR, file.bucket, file.path)
    await mkdir(dirname(destination), { recursive: true })
    await writeFile(destination, Buffer.from(await data.arrayBuffer()))
    manifest[storageKey(file)] = { size: file.size, updated_at: file.updated_at }
  }

  // AC-01-02 : les fichiers supprimés côté Supabase restent sur le disque et dans le manifeste.
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2))
  await log(`Stockage : ${remote.length} fichiers dans ${buckets?.length ?? 0} buckets, ${downloads.length - failures} copiés, ${failures} échecs`)
  if (failures > 0) throw new Error(`${failures} fichier(s) du stockage non copiés`)
}

async function applyRetention(): Promise<void> {
  const expired = expiredDumps(await readdir(DB_DIR), new Date(), RETENTION_DAYS)
  for (const name of expired) await rm(join(DB_DIR, name))
  // Restes d'une exécution interrompue.
  for (const name of (await readdir(DB_DIR)).filter(file => file.endsWith('.partial'))) await rm(join(DB_DIR, name))
  await log(`Rétention ${RETENTION_DAYS} j : ${expired.length} dump(s) supprimé(s)`)
}

async function notifyFailure(message: string) {
  const text = message.replace(/["\\]/g, '')
  await run('osascript', ['-e', `display notification "${text}" with title "Sauvegarde MyStay en échec"`]).catch(() => undefined)
}

async function main() {
  await mkdir(DB_DIR, { recursive: true })
  await mkdir(STORAGE_DIR, { recursive: true })
  await mkdir(LOG_DIR, { recursive: true })
  await log('Début de la sauvegarde')

  const databaseHost = new URL(requireEnv('DIRECT_URL')).hostname
  const supabaseHost = new URL(requireEnv('NEXT_PUBLIC_SUPABASE_URL')).hostname
  const online = await waitForNetwork(
    async () => {
      await Promise.all([lookup(databaseHost), lookup(supabaseHost)])
      return true
    },
    {
      intervalMs: NETWORK_CHECK_MS,
      maxWaitMs: NETWORK_WAIT_MS,
      onWait: () => { void log('Réseau indisponible (Mac en veille ?) : attente de la connexion…') },
    },
  )
  if (!online) {
    const message = `Réseau toujours indisponible après ${Math.round(NETWORK_WAIT_MS / 60_000)} min`
    await log(`ÉCHEC : ${message}`)
    await notifyFailure(message)
    process.exitCode = 1
    return
  }
  await log('Réseau disponible')

  const errors: string[] = []
  // Chaque étape est indépendante : un échec du stockage n'empêche pas le dump, et inversement.
  for (const [label, step] of [['Base', backupDatabase], ['Stockage', backupStorage], ['Rétention', applyRetention]] as const) {
    try {
      await step()
    } catch (error) {
      const message = redact(error instanceof Error ? error.message : String(error))
      errors.push(`${label} : ${message}`)
      await log(`ÉCHEC ${label} : ${message}`)
    }
  }

  if (errors.length > 0) {
    await notifyFailure(errors.join(' · ').slice(0, 200))
    await log(`Terminé avec ${errors.length} erreur(s)`)
    process.exitCode = 1
    return
  }
  await writeFile(join(BACKUP_DIR, 'last-success.json'), JSON.stringify({ at: new Date().toISOString() }, null, 2))
  await log(`Terminé en ${Math.round((Date.now() - startedAt.getTime()) / 1000)} s`)
}

main().catch(async error => {
  const message = redact(error instanceof Error ? error.message : String(error))
  await notifyFailure(message)
  console.error(message)
  process.exitCode = 1
})
