import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma'
import { apiError, validationError } from '@/features/merchant/lib/responses'
import { analyticsInteractionEventSchema } from '@/features/admin-analytics/schemas'

async function resolveCityId(citySlug: string | null | undefined): Promise<string | null> {
  if (!citySlug) return null

  const city = await prisma.city.findFirst({
    where: { slug: citySlug, deleted_at: null, is_active: true },
    select: { id: true },
  })

  return city?.id ?? null
}

async function resolveLodgingId(lodgingId: string | null | undefined): Promise<string | null> {
  if (!lodgingId) return null

  const lodging = await prisma.lodging.findFirst({
    where: { id: lodgingId, deleted_at: null, is_active: true },
    select: { id: true },
  })

  return lodging?.id ?? null
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null)
  const parsed = analyticsInteractionEventSchema.safeParse(body)

  if (!parsed.success) {
    return validationError(parsed.error.flatten())
  }

  const input = parsed.data
  const cityId = await resolveCityId(input.city_slug)
  const lodgingId = await resolveLodgingId(input.lodging_id)

  if (input.lodging_id && !lodgingId) {
    return apiError('INVALID_LODGING', 'Logement introuvable ou inactif', 400)
  }

  const event = await prisma.analyticsInteractionEvent.create({
    data: {
      event_type: input.event_type,
      consent_state: input.consent_state,
      page_path: input.page_path,
      city_id: cityId,
      lodging_id: lodgingId,
    },
    select: { id: true },
  })

  return NextResponse.json({ id: event.id, status: 'recorded' }, { status: 201 })
}
