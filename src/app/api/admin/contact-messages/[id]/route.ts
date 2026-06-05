import { NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError, validationError } from '@/features/merchant/lib/responses'
import { contactMessageIdSchema } from '@/features/contact-messages/schemas'
import { prisma } from '@/shared/lib/prisma'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: Request, context: RouteContext): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const { id } = await context.params
  const parsedId = contactMessageIdSchema.safeParse(id)
  if (!parsedId.success) {
    return validationError(parsedId.error.flatten())
  }

  const message = await prisma.contactMessage.findFirst({
    where: { id: parsedId.data, deleted_at: null },
    select: { id: true },
  })
  if (!message) {
    return apiError('NOT_FOUND', 'Message introuvable', 404)
  }

  await prisma.contactMessage.update({
    where: { id: message.id },
    data: {
      status: 'archived',
      archived_at: new Date(),
    },
    select: { id: true },
  })

  return NextResponse.json({ message: 'Message archivé' })
}
