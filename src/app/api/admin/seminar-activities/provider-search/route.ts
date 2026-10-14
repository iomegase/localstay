import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { ProviderSearchSchema } from '@/features/seminar-activities/lib/schemas'
import { seminarActivityErrorResponse, validationErrorResponse } from '@/features/seminar-activities/lib/api'
import { searchProviderPois } from '@/features/seminar-activities/queries/admin'

/** Spec 097 BR-09 : recherche de POI prestataires, toutes villes. */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const parsed = ProviderSearchSchema.safeParse({ q: req.nextUrl.searchParams.get('q') ?? '' })
  if (!parsed.success) return validationErrorResponse(parsed.error)

  try {
    return NextResponse.json({ items: await searchProviderPois(parsed.data.q) })
  } catch (error) {
    return seminarActivityErrorResponse(error)
  }
}
