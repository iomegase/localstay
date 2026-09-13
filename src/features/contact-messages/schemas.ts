import { z } from 'zod'

export const contactMessageDestinationSchema = z.enum(['owner', 'concierge'])

export const publicContactMessageSchema = z.object({
  source: z.literal('owner_lead').optional(),
  lodging_id: z.string().uuid().nullable().optional(),
  destination: contactMessageDestinationSchema,
  sender_name: z.string().trim().min(2).max(120),
  sender_email: z.string().trim().email(),
  sender_phone: z.string().trim().max(40).optional().nullable(),
  subject: z.string().trim().min(2).max(160),
  message: z.string().trim().min(10).max(2000),
  website: z.string().trim().max(240).optional(),
}).refine(
  (input) => input.source !== 'owner_lead' || (input.destination === 'concierge' && !input.lodging_id),
  { message: 'Une demande propriétaire doit être destinée à la conciergerie sans logement associé.', path: ['source'] },
)

export const contactMessageReplySchema = z.object({
  reply_body: z.string().trim().min(1).max(2000),
})

export const contactMessageIdSchema = z.string().uuid()

export type PublicContactMessageInput = z.infer<typeof publicContactMessageSchema>
export type ContactMessageReplyInput = z.infer<typeof contactMessageReplySchema>
