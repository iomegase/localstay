import { landingPageInputSchema } from '../schemas/landing-pages'
import type {
  LocalLandingIntent,
  LocalLandingPageInput,
} from '../types/landing-pages'

export type LandingContentField = string

export type LandingPageCompletenessInput = Partial<LocalLandingPageInput> & {
  intent: LocalLandingIntent
}

export function getLandingContentMissingFields(page: LandingPageCompletenessInput): LandingContentField[] {
  const parsed = landingPageInputSchema.safeParse({ reassurance: null, process_title: null, empty_copy: null, ...page })
  return parsed.success ? [] : [...new Set(parsed.error.issues.map(issue => issue.path.join('.')))]
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
