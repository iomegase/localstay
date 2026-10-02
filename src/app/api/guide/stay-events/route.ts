import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/shared/lib/prisma'
import { apiError, validationError } from '@/features/merchant/lib/responses'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { sendStayEventNotificationEmail } from '@/shared/lib/resend'

// Spec 054 AC-03-03 : un même signal répété dans cette fenêtre n'est ni stocké ni notifié.
const DEDUPE_WINDOW_MS = 10 * 60 * 1000

const stayEventSchema = z.object({
  type: z.enum(['arrived', 'departed']),
})

/**
 * Signal anonyme « arrivé / parti » depuis le guide privé (spec 054 US-03).
 * Le logement vient toujours de la session du guide, jamais du corps (BR-02).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const context = await getActiveLodgingContext()
  if (!context) {
    return apiError('UNAUTHORIZED', 'Aucun séjour actif', 401)
  }

  const body = await request.json().catch(() => null)
  const parsed = stayEventSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error.flatten())
  }
  const { type } = parsed.data

  const recent = await prisma.lodgingStayEvent.findFirst({
    where: {
      lodging_id: context.lodgingId,
      type,
      deleted_at: null,
      created_at: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) },
    },
    select: { id: true },
  })
  if (recent) {
    return NextResponse.json({ status: 'recorded' }, { status: 201 })
  }

  const event = await prisma.lodgingStayEvent.create({
    data: { lodging_id: context.lodgingId, type },
    select: { id: true },
  })

  const sent = await sendStayEventNotificationEmail({
    id: event.id,
    type,
    lodgingName: context.lodgingName,
    cityName: context.cityName,
  })
  if (!sent) {
    console.error('STAY_EVENT_EMAIL_FAILED', { eventId: event.id })
  }

  return NextResponse.json({ status: 'recorded' }, { status: 201 })
}
