import { prisma } from '@/shared/lib/prisma'
import { removeDeadPhotos } from '../lib/liveness'
import {
  fetchOfficialWebsitePhotoEnrichmentDetailed,
  mergeOfficialWebsitePhotos,
} from '@/features/poi-acquisition/services/official-website-photos'

export type HealResult = { removed: number; status: 'ok' | 'needs_refresh' }

/**
 * Retire les URLs (confirmées) mortes d'un POI, tente une ré-acquisition best-effort
 * des photos du site officiel, et pose le flag : `ok` si le POI garde ≥1 photo, sinon
 * `needs_refresh` (revue manuelle admin).
 */
export async function healPoiPhotos(input: { poiId: string; deadUrls: string[] }): Promise<HealResult> {
  const poi = await prisma.pointOfInterest.findUnique({
    where: { id: input.poiId },
    select: { photos: true, website: true },
  })
  if (!poi) return { removed: 0, status: 'ok' }

  const cleaned = removeDeadPhotos(poi.photos, input.deadUrls)
  const removed = poi.photos.length - cleaned.length

  let photos = cleaned
  const fetchResult = await fetchOfficialWebsitePhotoEnrichmentDetailed(poi.website)
  if (fetchResult.status === 'ok') {
    photos = mergeOfficialWebsitePhotos(cleaned, fetchResult.enrichment.photos)
  }

  const status: HealResult['status'] = photos.length > 0 ? 'ok' : 'needs_refresh'

  await prisma.pointOfInterest.update({
    where: { id: input.poiId },
    data: { photos, photos_status: status, photos_checked_at: new Date() },
    select: { id: true },
  })

  return { removed, status }
}
