import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import {
  CandidateUpdateSchema,
  parsedOrValidationError,
  readJson,
  responseFromPoiAcquisitionError,
} from '@/features/poi-acquisition/lib/api'
import { updateCandidate } from '@/features/poi-acquisition/queries/review'

// Spec 071 US-01 : modifier un candidat avant publication.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const body = await readJson(req)
  if (body instanceof NextResponse) return body

  const parsed = parsedOrValidationError(CandidateUpdateSchema.safeParse(body))
  if (parsed instanceof NextResponse) return parsed

  try {
    const { id } = await params
    return NextResponse.json({ data: await updateCandidate(id, parsed, session.user.id) })
  } catch (error) {
    return responseFromPoiAcquisitionError(error)
  }
}
