import { createSupabaseServer } from '@/shared/lib/supabase'
import { GUIDE_PHOTOS_BUCKET, guidePhotoPath } from '../lib/storage-paths'
import { loadReferencedStorageUrls } from '../queries/references'

// Spec 070 AC-04-01 / BR-06 : dossiers parcourus ; `fallbacks/` n'en fait jamais partie.
const SCANNED_ROOTS = ['pois', 'lodgings'] as const
// Spec 070 AC-04-03 : un fichier de moins de 24 h peut appartenir à un envoi en cours.
const MIN_AGE_MS = 24 * 60 * 60 * 1000
const LIST_PAGE = 1000
const REMOVE_BATCH = 500

type StoredFile = { path: string; size: number; createdAt: Date | null }
type StorageBucket = ReturnType<ReturnType<typeof createSupabaseServer>['storage']['from']>

async function listFiles(bucket: StorageBucket, prefix: string): Promise<StoredFile[]> {
  const files: StoredFile[] = []
  for (let offset = 0; ; offset += LIST_PAGE) {
    const { data, error } = await bucket.list(prefix, { limit: LIST_PAGE, offset })
    if (error) throw error
    for (const entry of data ?? []) {
      const path = `${prefix}/${entry.name}`
      if (entry.id) {
        const size = (entry.metadata as { size?: number } | null)?.size ?? 0
        files.push({ path, size, createdAt: entry.created_at ? new Date(entry.created_at) : null })
      } else {
        files.push(...await listFiles(bucket, path))
      }
    }
    if (!data || data.length < LIST_PAGE) break
  }
  return files
}

/**
 * Spec 070 US-04 : supprime de `guide-photos/pois/` et `guide-photos/lodgings/` les
 * fichiers qu'aucune donnée active ne référence (BR-04) et créés depuis plus de 24 h.
 */
export async function cleanupUnusedStorageFiles(options: { dryRun?: boolean; now?: Date } = {}): Promise<{
  scanned: number
  deleted: number
  bytes_freed: number
  dry_run: boolean
}> {
  const dryRun = options.dryRun ?? false
  const now = (options.now ?? new Date()).getTime()
  const bucket = createSupabaseServer().storage.from(GUIDE_PHOTOS_BUCKET)

  const [referenced, ...listed] = await Promise.all([
    loadReferencedStorageUrls(),
    ...SCANNED_ROOTS.map(root => listFiles(bucket, root)),
  ])
  const files = listed.flat()
  const referencedPaths = new Set([...referenced].map(guidePhotoPath).filter((path): path is string => path !== null))

  const unused = files.filter(file =>
    !referencedPaths.has(file.path)
    && file.createdAt !== null
    && now - file.createdAt.getTime() > MIN_AGE_MS,
  )

  if (!dryRun) {
    for (let index = 0; index < unused.length; index += REMOVE_BATCH) {
      const { error } = await bucket.remove(unused.slice(index, index + REMOVE_BATCH).map(file => file.path))
      if (error) throw error
    }
  }

  return {
    scanned: files.length,
    deleted: unused.length,
    bytes_freed: unused.reduce((total, file) => total + file.size, 0),
    dry_run: dryRun,
  }
}
