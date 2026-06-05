import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/shared/lib/prisma'
import { apiError, validationError } from '@/features/merchant/lib/responses'
import { publicContactMessageSchema } from '@/features/contact-messages/schemas'

type LodgingForContact = {
  id: string
  owner_id: string
  owner: { id: string; is_active: boolean; deleted_at: Date | null }
}

async function getLodging(lodgingId: string): Promise<LodgingForContact | null> {
  return prisma.lodging.findFirst({
    where: { id: lodgingId, deleted_at: null, is_active: true },
    select: {
      id: true,
      owner_id: true,
      owner: { select: { id: true, is_active: true, deleted_at: true } },
    },
  })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null)
  const parsed = publicContactMessageSchema.safeParse(body)

  if (!parsed.success) {
    return validationError(parsed.error.flatten())
  }

  const input = parsed.data
  const lodgingId = input.lodging_id ?? null
  const lodging = lodgingId ? await getLodging(lodgingId) : null

  if (input.destination === 'owner') {
    if (!lodging || !lodging.owner.is_active || lodging.owner.deleted_at !== null) {
      return apiError('INVALID_LODGING', 'Logement propriétaire introuvable ou inactif', 400)
    }
  }

  if (input.destination === 'concierge' && lodgingId && !lodging) {
    return apiError('INVALID_LODGING', 'Logement introuvable', 400)
  }

  const contactMessage = await prisma.contactMessage.create({
    data: {
      lodging_id: lodging?.id ?? null,
      owner_id: input.destination === 'owner' ? lodging?.owner_id ?? null : null,
      destination: input.destination,
      sender_name: input.sender_name,
      sender_email: input.sender_email,
      sender_phone: input.sender_phone?.trim() ? input.sender_phone : null,
      subject: input.subject,
      message: input.message,
    },
    select: { id: true },
  })

  return NextResponse.json({ id: contactMessage.id, status: 'received' }, { status: 201 })
}
