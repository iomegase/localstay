import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import {
  purgeStalePoiAcquisitionCandidates,
  purgeStaleTrailCandidates,
  STALE_CANDIDATE_DAYS,
} from '@/features/trails-acquisition/queries/cleanup'

export async function POST(_req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const [trails, pois] = await Promise.all([
    purgeStaleTrailCandidates(),
    purgeStalePoiAcquisitionCandidates(),
  ])

  return NextResponse.json({
    data: {
      threshold_days: STALE_CANDIDATE_DAYS,
      trail_candidates_purged: trails,
      poi_candidates_purged: pois,
    },
  })
}
