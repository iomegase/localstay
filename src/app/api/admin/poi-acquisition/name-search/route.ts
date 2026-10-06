import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { searchAcquisitionPlacesByName } from '@/features/poi-acquisition/queries/name-search'
import {
  AcquisitionNameSearchSchema,
  parsedOrValidationError,
  readJson,
  responseFromPoiAcquisitionError,
} from '@/features/poi-acquisition/lib/api'

// Spec 066 US-04 : « Ajouter un lieu précis ».
export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const body = await readJson(req)
  if (body instanceof NextResponse) return body

  const parsed = parsedOrValidationError(AcquisitionNameSearchSchema.safeParse(body))
  if (parsed instanceof NextResponse) return parsed

  try {
    const data = await searchAcquisitionPlacesByName(parsed)
    return NextResponse.json({ data })
  } catch (error) {
    return responseFromPoiAcquisitionError(error)
  }
}
