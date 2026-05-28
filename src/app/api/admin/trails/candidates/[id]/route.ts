import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { TrailCandidateUpdateSchema } from '@/features/trails-acquisition/schemas'
import {
  parsedOrValidationError,
  readJson,
  responseFromTrailsAcquisitionError,
} from '@/features/trails-acquisition/lib/api'
import { updateTrailCandidate } from '@/features/trails-acquisition/queries/review'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const body = await readJson(req)
  if (body instanceof NextResponse) return body

  const parsed = parsedOrValidationError(TrailCandidateUpdateSchema.safeParse(body))
  if (parsed instanceof NextResponse) return parsed

  try {
    const { id } = await params
    const data = await updateTrailCandidate(id, session.user.id, parsed)
    return NextResponse.json({ data })
  } catch (error) {
    return responseFromTrailsAcquisitionError(error)
  }
}
