import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import {
  ManualPoiCreateSchema,
  parsedOrValidationError,
  readJson,
  responseFromPoiAcquisitionError,
} from '@/features/poi-acquisition/lib/api'
import { createManualPoi } from '@/features/poi-acquisition/queries/manual-poi'
import { parseAdminPoiListFilters } from '@/features/admin-pois/lib/admin-poi-rules'
import { listAdminPois } from '@/features/admin-pois/queries/admin-pois'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const parsed = parsedOrValidationError(parseAdminPoiListFilters(Object.fromEntries(req.nextUrl.searchParams)))
  if (parsed instanceof NextResponse) return parsed

  try {
    const data = await listAdminPois(parsed)
    return NextResponse.json(data)
  } catch (error) {
    return responseFromPoiAcquisitionError(error)
  }
}

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
