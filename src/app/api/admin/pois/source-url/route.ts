import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import {
  ManualPoiSourceUrlSchema,
  parsedOrValidationError,
  readJson,
  responseFromPoiAcquisitionError,
} from '@/features/poi-acquisition/lib/api'
import { suggestManualPoiFromSourceUrl } from '@/features/poi-acquisition/services/manual-poi-source'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const body = await readJson(req)
  if (body instanceof NextResponse) return body

  const parsed = parsedOrValidationError(ManualPoiSourceUrlSchema.safeParse(body))
  if (parsed instanceof NextResponse) return parsed

  try {
    const data = await suggestManualPoiFromSourceUrl(parsed.source_url)
    return NextResponse.json({ data })
  } catch (error) {
    return responseFromPoiAcquisitionError(error)
  }
}

