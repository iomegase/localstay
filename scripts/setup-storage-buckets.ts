import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const REQUIRED_BUCKETS = [
  {
    id: 'merchant-poi-photos',
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  {
    id: 'qr-codes',
    public: true,
    fileSizeLimit: 1024 * 1024,
    allowedMimeTypes: ['image/png'],
  },
  {
    // Photos owner (couverture) + admin (POI) : png/jpeg convertis en webp avant upload,
    // webp & avif conservés tels quels → le bucket n'accepte que webp + avif.
    id: 'guide-photos',
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/webp', 'image/avif'],
  },
] as const

async function main() {
  loadEnvFile('.env')
  loadEnvFile('.env.local')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  for (const bucket of REQUIRED_BUCKETS) {
    const { data: existing, error: getError } = await supabase.storage.getBucket(bucket.id)

    if (existing && !getError) {
      const { error: updateError } = await supabase.storage.updateBucket(bucket.id, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: [...bucket.allowedMimeTypes],
      })
      if (updateError) throw new Error(`Failed to update bucket ${bucket.id}: ${updateError.message}`)
      console.log(`updated bucket: ${bucket.id}`)
      continue
    }

    const { error: createError } = await supabase.storage.createBucket(bucket.id, {
      public: bucket.public,
      fileSizeLimit: bucket.fileSizeLimit,
      allowedMimeTypes: [...bucket.allowedMimeTypes],
    })
    if (createError) throw new Error(`Failed to create bucket ${bucket.id}: ${createError.message}`)
    console.log(`created bucket: ${bucket.id}`)
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})

function loadEnvFile(fileName: string) {
  const path = resolve(process.cwd(), fileName)
  if (!existsSync(path)) return

  const lines = readFileSync(path, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    const rawValue = trimmed.slice(separatorIndex + 1).trim()
    if (!key || process.env[key] !== undefined) continue

    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '')
  }
}
