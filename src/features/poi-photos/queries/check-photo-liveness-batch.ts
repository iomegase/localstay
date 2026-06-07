import { prisma } from '@/shared/lib/prisma'
import { checkPhotoUrl } from '../services/check-photo-url'
import { healPoiPhotos } from '../services/heal-poi-photos'

export type LivenessBatchResult = { processed: number; poisFlagged: number; photosRemoved: number }

/** Balaye un lot de POIs (les moins récemment vérifiés d'abord), retire les photos mortes. */
export async function checkPhotoLivenessBatch(limit = 25): Promise<LivenessBatchResult> {
  const pois = await prisma.pointOfInterest.findMany({
    where: { is_active: true, deleted_at: null },
    orderBy: { photos_checked_at: { sort: 'asc', nulls: 'first' } },
    take: limit,
    select: { id: true, photos: true },
  })

  let poisFlagged = 0
  let photosRemoved = 0

  for (const poi of pois) {
    const deadUrls: string[] = []
    for (const url of poi.photos) {
      if ((await checkPhotoUrl(url)) === 'dead') deadUrls.push(url)
    }

    if (deadUrls.length === 0) {
      await prisma.pointOfInterest.update({
        where: { id: poi.id },
        data: { photos_checked_at: new Date() },
        select: { id: true },
      })
      continue
    }

    const result = await healPoiPhotos({ poiId: poi.id, deadUrls })
    photosRemoved += result.removed
    if (result.status === 'needs_refresh') poisFlagged += 1
  }

  return { processed: pois.length, poisFlagged, photosRemoved }
}
