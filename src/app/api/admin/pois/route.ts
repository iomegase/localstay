import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import {
  ManualPoiCreateSchema,
  parsedOrValidationError,
  readJson,
  responseFromPoiAcquisitionError,
} from '@/features/poi-acquisition/lib/api'
import { createManualPoi } from '@/features/poi-acquisition/queries/manual-poi'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const body = await readJson(req)
  if (body instanceof NextResponse) return body

  const parsed = parsedOrValidationError(ManualPoiCreateSchema.safeParse(body))
  if (parsed instanceof NextResponse) return parsed

  try {
    const data = await createManualPoi(parsed, session.user.id)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return responseFromPoiAcquisitionError(error)
  }
}
