import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/shared/lib/prisma'
import { apiError } from '@/features/merchant/lib/responses'
import { isEligibleForGooglePhotos } from '@/features/google-places-photos/lib/eligibility'
import { fetchGooglePlacePhotos } from '@/features/google-places-photos/services/place-photos'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const querySchema = z.object({ poi: z.string().uuid() })
const NO_STORE = { 'Cache-Control': 'no-store' }

/** Spec 103 AC-02-03 : photos Google d'un POI éligible, jamais mises en cache (AC-01-02). */
export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse({ poi: req.nextUrl.searchParams.get('poi') })
  if (!parsed.success) return apiError('INVALID_INPUT', 'Paramètres invalides.', 400, { issues: parsed.error.issues })

  const poi = await prisma.pointOfInterest.findFirst({
    where: { id: parsed.data.poi, deleted_at: null, is_active: true },
    select: { photos: true, google_place_id: true },
  })
  if (!poi || !isEligibleForGooglePhotos(poi)) {
    const response = apiError('NOT_FOUND', 'Aucune photo Google pour ce lieu.', 404)
    response.headers.set('Cache-Control', 'no-store')
    return response
  }

  const photos = await fetchGooglePlacePhotos(poi.google_place_id!)
  return NextResponse.json({ data: { photos } }, { headers: NO_STORE })
}
