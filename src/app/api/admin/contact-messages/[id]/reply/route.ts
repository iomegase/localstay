import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError, validationError } from '@/features/merchant/lib/responses'
import { contactMessageIdSchema, contactMessageReplySchema } from '@/features/contact-messages/schemas'
import { prisma } from '@/shared/lib/prisma'
import { sendContactReplyEmail } from '@/shared/lib/resend'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const { id } = await context.params
  const parsedId = contactMessageIdSchema.safeParse(id)
  if (!parsedId.success) {
    return validationError(parsedId.error.flatten())
  }

  const body = await request.json().catch(() => null)
  const parsedBody = contactMessageReplySchema.safeParse(body)
  if (!parsedBody.success) {
    return validationError(parsedBody.error.flatten())
  }

  const message = await prisma.contactMessage.findFirst({
    where: { id: parsedId.data, deleted_at: null },
    select: {
      id: true,
      sender_email: true,
      sender_name: true,
      subject: true,
      message: true,
    },
  })
  if (!message) {
    return apiError('NOT_FOUND', 'Message introuvable', 404)
  }

  await prisma.contactMessage.update({
    where: { id: message.id },
    data: {
      reply_body: parsedBody.data.reply_body,
      replied_at: new Date(),
      replied_by_user_id: session.user.id,
      status: 'replied',
    },
    select: { id: true },
  })

  const emailSent = await sendContactReplyEmail({
    to: message.sender_email,
    senderName: message.sender_name,
    subject: message.subject,
    originalMessage: message.message,
    replyBody: parsedBody.data.reply_body,
  })

  return NextResponse.json({ message: 'Réponse sauvegardée', email_sent: emailSent })
}
