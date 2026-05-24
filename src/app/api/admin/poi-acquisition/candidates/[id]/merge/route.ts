import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import {
  ReviewMergeSchema,
  parsedOrValidationError,
  readJson,
  responseFromPoiAcquisitionError,
} from '@/features/poi-acquisition/lib/api'
import { mergeCandidate } from '@/features/poi-acquisition/queries/review'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const body = await readJson(req)
  if (body instanceof NextResponse) return body

  const parsed = parsedOrValidationError(ReviewMergeSchema.safeParse(body))
  if (parsed instanceof NextResponse) return parsed

  try {
    const { id } = await params
    const data = await mergeCandidate(id, parsed.poi_id, session.user.id)
    return NextResponse.json({ data })
  } catch (error) {
    return responseFromPoiAcquisitionError(error)
  }
}
