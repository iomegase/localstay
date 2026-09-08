import type {
  LandingFaq,
  LandingHighlight,
  LandingStep,
  LocalLandingIntent,
  LocalLandingPageInput,
} from '../types/landing-pages'

export type LandingContentField =
  | 'seo_title'
  | 'meta_description'
  | 'eyebrow'
  | 'h1'
  | 'hero_title'
  | 'hero_copy'
  | 'section_title'
  | 'section_copy'
  | 'local_title'
  | 'local_copy'
  | 'cta_label'
  | 'cta_href'
  | 'empty_copy'
  | 'highlights'
  | 'steps'
  | 'faq'

export type LandingPageCompletenessInput = Partial<LocalLandingPageInput> & {
  intent: LocalLandingIntent
}

const commonRequiredFields: readonly LandingContentField[] = [
  'seo_title',
  'meta_description',
  'eyebrow',
  'h1',
  'hero_title',
  'hero_copy',
  'section_title',
  'section_copy',
  'local_title',
  'local_copy',
  'cta_label',
  'cta_href',
]

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function hasRepeatableItem(value: LandingHighlight | LandingStep | LandingFaq): boolean {
  if ('question' in value) return hasText(value.question) && hasText(value.answer)
  return hasText(value.title) && hasText(value.copy)
}

function hasItems(value: unknown): value is Array<LandingHighlight | LandingStep | LandingFaq> {
  return Array.isArray(value) && value.length > 0 && value.every(item => (
    typeof item === 'object' && item !== null && hasRepeatableItem(item as LandingHighlight | LandingStep | LandingFaq)
  ))
}

export function getLandingContentMissingFields(page: LandingPageCompletenessInput): LandingContentField[] {
  const missing: LandingContentField[] = []

  for (const field of commonRequiredFields) {
    if (!hasText(page[field] as string | null | undefined)) missing.push(field)
  }

  if (page.intent !== 'VACATION_RENTAL') {
    if (!hasItems(page.highlights)) missing.push('highlights')
    if (!hasItems(page.steps)) missing.push('steps')
    if (!hasItems(page.faq)) missing.push('faq')
  } else if (!hasText(page.empty_copy)) {
    missing.push('empty_copy')
  }

  return missing
}

export const getLandingPageMissingFields = getLandingContentMissingFields

export function evaluateLandingContentCompleteness(page: LandingPageCompletenessInput): {
  complete: boolean
  missingFields: LandingContentField[]
} {
  const missingFields = getLandingContentMissingFields(page)
  return { complete: missingFields.length === 0, missingFields }
}

export type LandingPublicationState = {
  concierge: boolean
  seminar: boolean
  vacationRental: boolean
}

export type LandingPublicationInput = {
  destinationActive: boolean
  serviceContentComplete: boolean
  vacationContentComplete: boolean
  publicLodgingCount: number
}

export function resolveLandingPublication(input: LandingPublicationInput): LandingPublicationState {
  const servicesPublished = input.destinationActive && input.serviceContentComplete
  return {
    concierge: servicesPublished,
    seminar: servicesPublished,
    vacationRental: servicesPublished && input.vacationContentComplete && input.publicLodgingCount > 0,
  }
}
