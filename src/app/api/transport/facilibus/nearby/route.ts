import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { validationError } from '@/features/merchant/lib/responses'
import { getFacilibusNearby } from '@/features/transport/facilibus'
import { transportJson } from '@/features/transport/lib/http'

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
  return transportJson(await getFacilibusNearby(parsed.data.lat, parsed.data.lng), 3600)
}
