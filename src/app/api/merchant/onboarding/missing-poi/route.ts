import { NextRequest, NextResponse } from 'next/server'
import { getSessionMerchant } from '@/features/merchant/lib/session'
import {
  MissingPoiCreateSchema,
  parsedOrValidationError,
  readJson,
  responseFromPoiAcquisitionError,
} from '@/features/poi-acquisition/lib/api'
import { createMissingPoiRequest } from '@/features/poi-acquisition/queries/missing-poi'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionMerchant()
  if (session.error) return session.error

  const body = await readJson(req)
  if (body instanceof NextResponse) return body

  const parsed = parsedOrValidationError(MissingPoiCreateSchema.safeParse(body))
  if (parsed instanceof NextResponse) return parsed

  try {
    const data = await createMissingPoiRequest(session.user.id, parsed)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return responseFromPoiAcquisitionError(error)
  }
}
