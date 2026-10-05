import { NextRequest, NextResponse } from 'next/server'
import { mirrorPendingPoiPhotos } from '@/features/poi-photos/services/mirror-poi-photos'

// Spec 063 BR-06 : au plus 40 photos par exécution.
const BATCH_LIMIT = 40
export const maxDuration = 300

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET
  return Boolean(secret) && req.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Secret interne absent ou invalide', details: {} } },
      { status: 401 },
    )
  }
  const report = await mirrorPendingPoiPhotos(BATCH_LIMIT)
  return NextResponse.json(report)
}
