import { prisma } from '@/shared/lib/prisma'
import { removeDeadPhotos } from '../lib/liveness'
import {
  fetchOfficialWebsitePhotoEnrichmentDetailed,
  mergeOfficialWebsitePhotos,
} from '@/features/poi-acquisition/services/official-website-photos'
import { runPoiMutationWithDiscoveryReconciliation } from '@/features/public-discovery/queries/mutation-reconciliation'
import { safelyRevalidateDiscoveryPaths } from '@/features/public-discovery/lib/revalidation'

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

  const fetchResult = await fetchOfficialWebsitePhotoEnrichmentDetailed(poi.website)

  const mutation = await runPoiMutationWithDiscoveryReconciliation({
    poiWhere: { id: input.poiId },
    auditActor: { type: 'SYSTEM' },
    cause: { source: 'photo_healer', reason: 'dead_photos_removed' },
    mutate: async tx => {
      const current = await tx.pointOfInterest.findUnique({
        where: { id: input.poiId },
        select: { photos: true, website: true },
      })
      if (!current) return { removed: 0, status: 'ok' } satisfies HealResult

      const cleaned = removeDeadPhotos(current.photos, input.deadUrls)
      const removed = current.photos.length - cleaned.length
      const photos = fetchResult.status === 'ok' && current.website === poi.website
        ? mergeOfficialWebsitePhotos(cleaned, fetchResult.enrichment.photos)
        : cleaned
      const status: HealResult['status'] = photos.length > 0 ? 'ok' : 'needs_refresh'

      await tx.pointOfInterest.update({
        where: { id: input.poiId },
        data: { photos, photos_status: status, photos_checked_at: new Date() },
        select: { id: true },
      })
      return { removed, status }
    },
  })
  if (mutation.discoveryRevalidationPaths.length > 0) {
    safelyRevalidateDiscoveryPaths(mutation.discoveryRevalidationPaths)
  }

  return mutation.result
}
