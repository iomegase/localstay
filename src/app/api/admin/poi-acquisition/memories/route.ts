import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { validationError } from '@/features/merchant/lib/responses'
import { responseFromPoiAcquisitionError } from '@/features/poi-acquisition/lib/api'
import { listReviewMemories } from '@/features/poi-acquisition/queries/review-memory'

// Spec 071 AC-03-03 : lieux exclus ou rejetés.
const QuerySchema = z.object({ city_id: z.string().uuid().optional() }).strict()

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const parsed = QuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams))
  if (!parsed.success) return validationError(parsed.error.flatten())

  try {
    return NextResponse.json({ data: await listReviewMemories(parsed.data.city_id) })
  } catch (error) {
    return responseFromPoiAcquisitionError(error)
  }
}
