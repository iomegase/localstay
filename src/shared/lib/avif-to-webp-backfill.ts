import { encodeStoredWebp } from '@/shared/lib/image-upload-service'

const PUBLIC_PREFIX = '/storage/v1/object/public/guide-photos/'

export interface StoredPhotoRow {
  id: string
  url: string
}

export interface AvifBackfillDeps {
  download: (path: string) => Promise<Buffer>
  upload: (path: string, body: Buffer) => Promise<void>
  publicUrl: (path: string) => string
  updateUrl: (id: string, url: string) => Promise<void>
}

export interface AvifBackfillReport {
  converted: number
  skipped: number
  failed: number
}

/** Chemins source (.avif) et cible (.webp) dans le bucket `guide-photos`, ou null hors bucket. */
export function webpPathForStorageUrl(url: string): { source: string; target: string } | null {
  const index = url.indexOf(PUBLIC_PREFIX)
  if (index === -1 || !url.endsWith('.avif')) return null
  const source = decodeURIComponent(url.slice(index + PUBLIC_PREFIX.length))
  return { source, target: source.replace(/\.avif$/, '.webp') }
}

/**
 * Spec 012 BR-26 — convertit une fois les photos AVIF déjà stockées : écrit un WebP à côté,
 * met à jour l'URL de la ligne, conserve le fichier AVIF. Sans `apply`, ne fait que compter.
 */
export async function convertStoredAvifPhotos(
  rows: StoredPhotoRow[],
  deps: AvifBackfillDeps,
  options: { apply: boolean },
): Promise<AvifBackfillReport> {
  const report: AvifBackfillReport = { converted: 0, skipped: 0, failed: 0 }
  for (const row of rows) {
    const paths = webpPathForStorageUrl(row.url)
    if (!paths) {
      report.skipped += 1
      continue
    }
    if (!options.apply) {
      report.converted += 1
      continue
    }
    try {
      const webp = await encodeStoredWebp(await deps.download(paths.source))
      await deps.upload(paths.target, webp)
      await deps.updateUrl(row.id, deps.publicUrl(paths.target))
      report.converted += 1
    } catch (error) {
      console.error(`[avif-backfill] ${row.id} : ${error instanceof Error ? error.message : String(error)}`)
      report.failed += 1
    }
  }
  return report
}
