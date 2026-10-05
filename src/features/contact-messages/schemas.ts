import { z } from 'zod'

export const contactMessageDestinationSchema = z.enum(['owner', 'concierge'])

export const publicContactMessageSchema = z.object({
  source: z.enum(['owner_lead', 'seminar_lead', 'help_contact', 'lodging_inquiry']).optional(),
  lodging_id: z.string().uuid().nullable().optional(),
  // Fiche logement publique (amendement 028 du 2026-10-05) : le logement est
  // désigné par son slug public, jamais par un identifiant de base.
  lodging_slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160).optional(),
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
).refine(
  (input) => input.source !== 'seminar_lead' || (input.destination === 'concierge' && !input.lodging_id),
  { message: 'Une demande séminaire doit être destinée à la conciergerie sans logement associé.', path: ['source'] },
).refine(
  (input) => input.source !== 'help_contact' || (input.destination === 'concierge' && !input.lodging_id),
  { message: 'Un message Aide & contact doit être destiné à la conciergerie sans logement associé.', path: ['source'] },
).refine(
  (input) => input.source !== 'lodging_inquiry'
    || (input.destination === 'concierge' && !input.lodging_id && Boolean(input.lodging_slug)),
  { message: 'Une demande logement doit être destinée à la conciergerie et désigner le logement par son slug public.', path: ['source'] },
).refine(
  (input) => input.source === 'lodging_inquiry' || input.lodging_slug === undefined,
  { message: 'Le slug de logement est réservé aux demandes logement.', path: ['lodging_slug'] },
)

export const contactMessageReplySchema = z.object({
  reply_body: z.string().trim().min(1).max(2000),
})

export const contactMessageIdSchema = z.string().uuid()

export type PublicContactMessageInput = z.infer<typeof publicContactMessageSchema>
export type ContactMessageReplyInput = z.infer<typeof contactMessageReplySchema>
