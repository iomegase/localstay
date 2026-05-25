import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { TrailMergeSchema } from '@/features/trails-acquisition/schemas'
import {
  parsedOrValidationError,
  readJson,
  responseFromTrailsAcquisitionError,
} from '@/features/trails-acquisition/lib/api'
import { mergeTrailCandidate } from '@/features/trails-acquisition/queries/review'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const body = await readJson(req)
  if (body instanceof NextResponse) return body

  const parsed = parsedOrValidationError(TrailMergeSchema.safeParse(body))
  if (parsed instanceof NextResponse) return parsed

  try {
    const { id } = await params
    const data = await mergeTrailCandidate(id, parsed.poi_id, session.user.id)
    return NextResponse.json({ data })
  } catch (error) {
    return responseFromTrailsAcquisitionError(error)
  }
}
