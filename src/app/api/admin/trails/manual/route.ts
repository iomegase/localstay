import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { TrailManualCandidateCreateSchema } from '@/features/trails-acquisition/schemas'
import {
  parsedOrValidationError,
  readJson,
  responseFromTrailsAcquisitionError,
} from '@/features/trails-acquisition/lib/api'
import { createManualTrailCandidate } from '@/features/trails-acquisition/queries/manual'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const body = await readJson(req)
  if (body instanceof NextResponse) return body

  const parsed = parsedOrValidationError(TrailManualCandidateCreateSchema.safeParse(body))
  if (parsed instanceof NextResponse) return parsed

  try {
    const data = await createManualTrailCandidate(parsed, session.user.id)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return responseFromTrailsAcquisitionError(error)
  }
}
