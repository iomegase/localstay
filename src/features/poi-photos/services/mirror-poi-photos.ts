import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { prisma } from '@/shared/lib/prisma'
import { createSupabaseServer } from '@/shared/lib/supabase'
import { isThirdPartyPhotoUrl } from '../lib/storage-url'
import { downloadImageSafely } from './safe-image-download'
import { safelyRevalidateDiscoveryPaths } from '@/features/public-discovery/lib/revalidation'

const BUCKET = 'guide-photos'
const MAX_WIDTH = 1600

export type MirrorReport = { mirrored: number; skipped: number; failed: number }
export type MirrorDeps = {
  download: typeof downloadImageSafely
  upload: (path: string, body: Buffer) => Promise<string | null>
  revalidate: (poiId: string) => void
}

async function uploadToGuidePhotos(path: string, body: Buffer): Promise<string | null> {
  const supabase = createSupabaseServer()
  const { data, error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: 'image/webp',
    upsert: true,
  })
  if (error || !data) return null
  return supabase.storage.from(BUCKET).getPublicUrl(data.path).data.publicUrl
}

async function revalidatePoi(poiId: string): Promise<void> {
  const poi = await prisma.pointOfInterest.findFirst({
    where: { id: poiId },
    select: { slug: true, city: { select: { slug: true } }, category: { select: { slug: true } } },
  })
  if (poi) {
    safelyRevalidateDiscoveryPaths([
      `/decouvrir/${poi.city.slug}`,
      `/decouvrir/${poi.city.slug}/${poi.category.slug}`,
      `/decouvrir/${poi.city.slug}/${poi.category.slug}/${poi.slug}`,
    ])
  }
}

const defaultDeps: MirrorDeps = {
  download: downloadImageSafely,
  upload: uploadToGuidePhotos,
  revalidate: poiId => { void revalidatePoi(poiId) },
}

function photoHash(sourceUrl: string): string {
  return createHash('sha256').update(sourceUrl).digest('hex').slice(0, 16)
}

async function mirrorOne(poiId: string, sourceUrl: string, deps: MirrorDeps): Promise<boolean> {
  const download = await deps.download(sourceUrl)
  if (!download.ok) {
    console.error('POI_PHOTO_MIRROR_FAILED', { poiId, sourceUrl, reason: download.reason })
    return false
  }
  try {
    const { data, info } = await sharp(download.body)
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true })
    const storageUrl = await deps.upload(`pois/${poiId}/${photoHash(sourceUrl)}.webp`, data)
    if (!storageUrl) {
      console.error('POI_PHOTO_MIRROR_FAILED', { poiId, sourceUrl, reason: 'UPLOAD_FAILED' })
      return false
    }
    await prisma.poiPhotoMirror.upsert({
      where: { poi_id_source_url: { poi_id: poiId, source_url: sourceUrl } },
      create: { poi_id: poiId, source_url: sourceUrl, storage_url: storageUrl, width: info.width, bytes: info.size },
      update: { storage_url: storageUrl, width: info.width, bytes: info.size, deleted_at: null },
    })
    return true
  } catch (error) {
    console.error('POI_PHOTO_MIRROR_FAILED', { poiId, sourceUrl, reason: 'CONVERSION_FAILED', error })
    return false
  }
}

/** Spec 063 AC-01-01..03 — copie les photos tierces d'un POI publié qui n'ont pas encore de copie. */
export async function mirrorPoiPhotos(poiId: string, deps: MirrorDeps = defaultDeps, budget = Number.POSITIVE_INFINITY): Promise<MirrorReport> {
  const report: MirrorReport = { mirrored: 0, skipped: 0, failed: 0 }
  const poi = await prisma.pointOfInterest.findFirst({
    where: { id: poiId, discovery_status: 'PUBLISHED', deleted_at: null },
    select: { id: true, photos: true },
  })
  if (!poi) return report

  const existing = await prisma.poiPhotoMirror.findMany({
    where: { poi_id: poiId, deleted_at: null },
    select: { source_url: true },
  })
  const mirroredUrls = new Set(existing.map(row => row.source_url))

  for (const sourceUrl of poi.photos) {
    if (!isThirdPartyPhotoUrl(sourceUrl) || mirroredUrls.has(sourceUrl)) {
      report.skipped += 1
      continue
    }
    if (report.mirrored + report.failed >= budget) break
    if (await mirrorOne(poiId, sourceUrl, deps)) {
      report.mirrored += 1
      mirroredUrls.add(sourceUrl)
    } else {
      report.failed += 1
    }
  }

  if (report.mirrored > 0) deps.revalidate(poiId)
  return report
}

/** Spec 063 AC-01-04 / BR-06 — tâche quotidienne : au plus `limit` copies tentées. */
export async function mirrorPendingPoiPhotos(limit: number, deps: MirrorDeps = defaultDeps): Promise<MirrorReport> {
  const total: MirrorReport = { mirrored: 0, skipped: 0, failed: 0 }
  const pois = await prisma.pointOfInterest.findMany({
    where: { discovery_status: 'PUBLISHED', deleted_at: null },
    orderBy: { discovery_published_at: 'asc' },
    select: { id: true, photos: true, photo_mirrors: { where: { deleted_at: null }, select: { source_url: true } } },
  })

  for (const poi of pois) {
    const remaining = limit - total.mirrored - total.failed
    if (remaining <= 0) break
    const mirrored = new Set(poi.photo_mirrors.map(row => row.source_url))
    if (!poi.photos.some(url => isThirdPartyPhotoUrl(url) && !mirrored.has(url))) continue

    const report = await mirrorPoiPhotos(poi.id, deps, remaining)
    total.mirrored += report.mirrored
    total.skipped += report.skipped
    total.failed += report.failed
  }
  return total
}
