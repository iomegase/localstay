import { prisma } from '@/shared/lib/prisma'

export const STALE_CANDIDATE_DAYS = 3

export async function purgeStaleTrailCandidates(): Promise<number> {
  const cutoff = new Date(Date.now() - STALE_CANDIDATE_DAYS * 24 * 60 * 60 * 1000)
  const result = await prisma.trailCandidate.updateMany({
    where: {
      deleted_at: null,
      review_status: 'needs_review',
      published_poi_id: null,
      created_at: { lt: cutoff },
    },
    data: { deleted_at: new Date() },
  })
  return result.count
}

export async function purgeStalePoiAcquisitionCandidates(): Promise<number> {
  const cutoff = new Date(Date.now() - STALE_CANDIDATE_DAYS * 24 * 60 * 60 * 1000)
  const result = await prisma.poiAcquisitionCandidate.updateMany({
    where: {
      deleted_at: null,
      review_status: 'needs_review',
      published_poi_id: null,
      created_at: { lt: cutoff },
    },
    data: { deleted_at: new Date() },
  })
  return result.count
}
