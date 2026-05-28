import { NextRequest, NextResponse } from 'next/server'
import {
  purgeStalePoiAcquisitionCandidates,
  purgeStaleTrailCandidates,
  STALE_CANDIDATE_DAYS,
} from '@/features/trails-acquisition/queries/cleanup'

function isAuthorized(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? ''
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) return false
  return header === `Bearer ${secret}`
}

async function handle(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Unauthorized', details: {} } },
      { status: 401 },
    )
  }

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

export async function GET(req: NextRequest): Promise<NextResponse> {
  return handle(req)
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return handle(req)
}
