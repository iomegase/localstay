import { prisma } from '@/shared/lib/prisma'
import type { AdminContactMessageRow, OwnerContactMessageRow } from '../types'

export async function listAdminContactMessages(): Promise<AdminContactMessageRow[]> {
  const messages = await prisma.contactMessage.findMany({
    where: { deleted_at: null },
    orderBy: { created_at: 'desc' },
    take: 100,
    select: {
      id: true,
      created_at: true,
      destination: true,
      status: true,
      sender_name: true,
      sender_email: true,
      sender_phone: true,
      subject: true,
      message: true,
      archived_at: true,
      reply_body: true,
      replied_at: true,
      lodging: { select: { name: true } },
    },
  })

  return messages.map((message) => ({
    id: message.id,
    created_at: message.created_at.toISOString(),
    lodging_name: message.lodging?.name ?? 'Sans logement',
    destination: message.destination,
    status: message.status,
    sender_name: message.sender_name,
    sender_email: message.sender_email,
    sender_phone: message.sender_phone,
    subject: message.subject,
    message: message.message,
    archived_at: message.archived_at?.toISOString() ?? null,
    reply_body: message.reply_body,
    replied_at: message.replied_at?.toISOString() ?? null,
  }))
}

export async function listOwnerContactMessages(ownerId: string): Promise<OwnerContactMessageRow[]> {
  const messages = await prisma.contactMessage.findMany({
    where: {
      owner_id: ownerId,
      destination: 'owner',
      deleted_at: null,
    },
    orderBy: { created_at: 'desc' },
    take: 100,
    select: {
      id: true,
      created_at: true,
      status: true,
      sender_name: true,
      sender_email: true,
      sender_phone: true,
      subject: true,
      message: true,
      lodging: { select: { name: true } },
    },
  })

  return messages.map((message) => ({
    id: message.id,
    created_at: message.created_at.toISOString(),
    lodging_name: message.lodging?.name ?? 'Sans logement',
    status: message.status,
    sender_name: message.sender_name,
    sender_email: message.sender_email,
    sender_phone: message.sender_phone,
    subject: message.subject,
    message: message.message,
  }))
}
