import { z } from 'zod'
import { LOCAL_LANDING_INTENTS } from '../types/landing-pages'

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

export type LandingDestinationInput = z.infer<typeof LandingDestinationInputSchema>
export type LandingPublicationInput = z.infer<typeof LandingPublicationInputSchema>
export type LandingPagesUpdateInput = z.infer<typeof LandingPagesUpdateSchema>
