import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import {
  ReviewPublishSchema,
  parsedOrValidationError,
  readJson,
  responseFromPoiAcquisitionError,
} from '@/features/poi-acquisition/lib/api'
import { publishCandidate } from '@/features/poi-acquisition/queries/review'
import { refreshFallbackImagesSafely } from '@/features/fallback-images/services/reassign'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const body = await readJson(req)
  if (body instanceof NextResponse) return body

  const parsed = parsedOrValidationError(ReviewPublishSchema.safeParse(body))
  if (parsed instanceof NextResponse) return parsed

  try {
    const { id } = await params
    const data = await publishCandidate(id, session.user.id, parsed)
    await refreshFallbackImagesSafely([data.published_poi_id])
    return NextResponse.json({ data })
  } catch (error) {
    return responseFromPoiAcquisitionError(error)
  }
}
