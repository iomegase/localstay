import { z } from 'zod'
import { LOCAL_LANDING_INTENTS } from '../types/landing-pages'
import type { AdminLandingDestinationDto } from '../types/landing-pages'
import { LandingReviewResponseSchema } from './landing-reviews'

const requiredText = z.string().trim().min(3).max(2000)

const repeatableItemSchema = z.object({
  title: requiredText.max(160),
  copy: requiredText,
}).strict()

const faqSchema = z.object({
  question: requiredText.max(240),
  answer: requiredText,
}).strict()

const internalPath = /^\/(?!\/)[^\\\s\x00-\x1F\x7F]*$/
const mailtoUrl = /^mailto:[^@\s]+@[^@\s]+$/i

const ctaHrefSchema = z.string().trim().min(1).max(500).refine(
  value => internalPath.test(value) || mailtoUrl.test(value),
  'Le CTA doit pointer vers un chemin interne ou une adresse mailto.',
)

export const LandingDestinationInputSchema = z.object({
  city_id: z.string().trim().min(1),
}).strict()

export const LandingPublicationInputSchema = z.object({
  is_active: z.boolean(),
}).strict()

export const LandingPageIdSchema = z.object({
  id: z.string().uuid(),
}).strict()

export const landingPageInputSchema = z.object({
  intent: z.enum(LOCAL_LANDING_INTENTS),
  seo_title: requiredText.max(180),
  meta_description: requiredText.max(320),
  eyebrow: requiredText.max(100),
  h1: requiredText.max(180),
  hero_title: requiredText.max(240),
  hero_copy: requiredText,
  reassurance: z.string().trim().max(300).nullable(),
  section_title: requiredText.max(240),
  section_copy: requiredText,
  process_title: z.string().trim().min(3).max(240).nullable(),
  local_title: requiredText.max(240),
  local_copy: requiredText,
  cta_label: requiredText.max(120),
  cta_href: ctaHrefSchema,
  empty_copy: z.string().trim().min(3).max(2000).nullable(),
  highlights: z.array(repeatableItemSchema).max(12),
  steps: z.array(repeatableItemSchema).max(12),
  faq: z.array(faqSchema).max(20),
}).strict().superRefine((value, context) => {
  if (value.intent !== 'VACATION_RENTAL' && value.highlights.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['highlights'],
      message: 'Ajoutez au moins un point fort.',
    })
  }
  if (value.intent !== 'VACATION_RENTAL' && value.steps.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['steps'],
      message: 'Ajoutez au moins une étape.',
    })
  }
  if (value.intent !== 'VACATION_RENTAL' && value.faq.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['faq'],
      message: 'Ajoutez au moins une FAQ.',
    })
  }
  if (value.intent === 'VACATION_RENTAL' && !value.empty_copy) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['empty_copy'],
      message: 'Le texte sans logement est requis.',
    })
  }
})

export const LandingPagesUpdateSchema = z.object({
  pages: z.array(landingPageInputSchema).length(3),
}).strict().superRefine((value, context) => {
  const intents = value.pages.map(page => page.intent)
  const missingIntents = LOCAL_LANDING_INTENTS.filter(intent => !intents.includes(intent))
  const duplicateIntents = LOCAL_LANDING_INTENTS.filter(intent => (
    intents.filter(candidate => candidate === intent).length > 1
  ))

  if (missingIntents.length > 0 || duplicateIntents.length > 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['pages'],
      message: 'Les trois intentions doivent être présentes une seule fois chacune.',
      params: { missingIntents, duplicateIntents },
    })
  }
})

const editableRepeatableItemSchema = z.object({
  title: z.string(),
  copy: z.string(),
}).strict()

const editableFaqSchema = z.object({
  question: z.string(),
  answer: z.string(),
}).strict()

const editableLandingPageSchema = z.object({
  intent: z.enum(LOCAL_LANDING_INTENTS),
  seo_title: z.string(),
  meta_description: z.string(),
  eyebrow: z.string(),
  h1: z.string(),
  hero_title: z.string(),
  hero_copy: z.string(),
  reassurance: z.string().nullable(),
  section_title: z.string(),
  section_copy: z.string(),
  process_title: z.string().nullable(),
  local_title: z.string(),
  local_copy: z.string(),
  cta_label: z.string(),
  cta_href: z.string(),
  empty_copy: z.string().nullable(),
  highlights: z.array(editableRepeatableItemSchema),
  steps: z.array(editableRepeatableItemSchema),
  faq: z.array(editableFaqSchema),
}).strict()

const editableLandingPagesSchema = z.array(editableLandingPageSchema).length(3).superRefine((pages, context) => {
  const intents = pages.map(page => page.intent)
  if (LOCAL_LANDING_INTENTS.some(intent => intents.filter(candidate => candidate === intent).length !== 1)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La réponse doit contenir les trois intentions une seule fois chacune.',
    })
  }
})

export const AdminLandingDestinationResponseSchema: z.ZodType<AdminLandingDestinationDto> = z.object({
  id: z.string(),
  city: z.object({ id: z.string(), name: z.string(), slug: z.string() }).strict(),
  is_active: z.boolean(),
  pages: editableLandingPagesSchema,
  publication: z.object({
    concierge: z.boolean(),
    seminar: z.boolean(),
    vacationRental: z.boolean(),
  }).strict(),
  contentIssues: z.array(z.object({
    intent: z.enum(LOCAL_LANDING_INTENTS),
    field: z.string(),
    message: z.string(),
  }).strict()),
  publicLodgingCount: z.number().int().nonnegative(),
  reviewCount: z.number().int().nonnegative(),
  reviews: z.array(LandingReviewResponseSchema),
  created_at: z.string(),
  updated_at: z.string(),
}).strict()

export const LandingDestinationDeleteResponseSchema = z.object({ id: z.string() }).strict()

export const LandingAdminApiErrorResponseSchema = z.object({
  error: z.object({
    message: z.string().optional(),
    details: z.unknown().optional(),
  }).passthrough(),
}).passthrough()

export type LandingDestinationInput = z.infer<typeof LandingDestinationInputSchema>
export type LandingPublicationInput = z.infer<typeof LandingPublicationInputSchema>
export type LandingPagesUpdateInput = z.infer<typeof LandingPagesUpdateSchema>
