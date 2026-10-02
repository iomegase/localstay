import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validationError } from '@/features/merchant/lib/responses'
import { getFacilibusNearby } from '@/features/transport/facilibus'
import { transportJson } from '@/features/transport/lib/http'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'

const querySchema = z.object({
  lat: z.coerce.number().finite().min(-90).max(90),
  lng: z.coerce.number().finite().min(-180).max(180),
})

/** Stations Facilibus proches de coordonnées (spec 055 AC-04-01). */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const parsed = querySchema.safeParse({
    lat: request.nextUrl.searchParams.get('lat') ?? undefined,
    lng: request.nextUrl.searchParams.get('lng') ?? undefined,
  })
  if (!parsed.success) return validationError(parsed.error.flatten())

  // Temps MapBox réservés aux voyageurs en séjour (coût maîtrisé, spec 057).
  const withTravel = Boolean(await getActiveLodgingContext())
  const response = transportJson(
    await getFacilibusNearby(parsed.data.lat, parsed.data.lng, { withTravel }),
    3600,
  )
  if (withTravel) response.headers.set('Cache-Control', 'private, max-age=3600')
  return response
}
