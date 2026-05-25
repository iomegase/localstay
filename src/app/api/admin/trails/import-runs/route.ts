import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { TrailImportRunCreateSchema } from '@/features/trails-acquisition/schemas'
import {
  parsedOrValidationError,
  readJson,
  responseFromTrailsAcquisitionError,
} from '@/features/trails-acquisition/lib/api'
import { createTrailImportRun, listTrailImportRuns } from '@/features/trails-acquisition/queries/runs'

export async function GET(): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const data = await listTrailImportRuns()
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const body = await readJson(req)
  if (body instanceof NextResponse) return body

  const parsed = parsedOrValidationError(TrailImportRunCreateSchema.safeParse(body))
  if (parsed instanceof NextResponse) return parsed

  try {
    const data = await createTrailImportRun(parsed, session.user.id)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return responseFromTrailsAcquisitionError(error)
  }
}
