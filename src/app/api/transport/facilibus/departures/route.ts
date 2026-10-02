import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, validationError } from '@/features/merchant/lib/responses'
import { FACILIBUS, getFacilibusDepartures } from '@/features/transport/facilibus'
import { transportJson } from '@/features/transport/lib/http'

const querySchema = z.object({
  stationId: z.string().regex(/^[a-z0-9-]{1,80}$/),
  limit: z.coerce.number().int().min(1).max(FACILIBUS.maxLimit).default(FACILIBUS.defaultLimit),
})

/**
 * Prochains passages d'une station physique, tous quais et directions confondus
 * (spec 055 AC-02-02). Fenêtre de 24 h bornée par les horaires publiés.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const parsed = querySchema.safeParse({
    stationId: request.nextUrl.searchParams.get('stationId') ?? undefined,
    limit: request.nextUrl.searchParams.get('limit') ?? undefined,
  })
  if (!parsed.success) return validationError(parsed.error.flatten())

  const envelope = await getFacilibusDepartures(parsed.data.stationId, parsed.data.limit)
  if (!envelope) return apiError('STATION_NOT_FOUND', 'Station introuvable.', 404)
  return transportJson(envelope, 30)
}
