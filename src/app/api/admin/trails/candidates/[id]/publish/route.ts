import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { TrailPublishSchema } from '@/features/trails-acquisition/schemas'
import {
  parsedOrValidationError,
  readJson,
  responseFromTrailsAcquisitionError,
} from '@/features/trails-acquisition/lib/api'
import { publishTrailCandidate } from '@/features/trails-acquisition/queries/review'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const body = await readJson(req)
  if (body instanceof NextResponse) return body

  const parsed = parsedOrValidationError(TrailPublishSchema.safeParse(body))
  if (parsed instanceof NextResponse) return parsed

  try {
    const { id } = await params
    const data = await publishTrailCandidate(id, session.user.id, parsed)
    return NextResponse.json({ data })
  } catch (error) {
    return responseFromTrailsAcquisitionError(error)
  }
}
