export const LOCAL_LANDING_INTENTS = ['CONCIERGE', 'SEMINAR', 'VACATION_RENTAL'] as const

export type LocalLandingIntent = (typeof LOCAL_LANDING_INTENTS)[number]

export type LandingHighlight = {
  title: string
  copy: string
}

export type LandingStep = {
  title: string
  copy: string
}

export type LandingFaq = {
  question: string
  answer: string
}

export type LocalLandingPageInput = {
  intent: LocalLandingIntent
  seo_title: string
  meta_description: string
  eyebrow: string
  h1: string
  hero_title: string
  hero_copy: string
  reassurance: string | null
  section_title: string
  section_copy: string
  process_title: string | null
  local_title: string
  local_copy: string
  cta_label: string
  cta_href: string
  empty_copy: string | null
  highlights: LandingHighlight[]
  steps: LandingStep[]
  faq: LandingFaq[]
}

export type LandingPageInput = LocalLandingPageInput

export type EligibleLandingCityDto = {
  id: string
  name: string
  slug: string
}

export type LandingContentIssue = {
  intent: LocalLandingIntent
  field: string
  message: string
}

export type LandingPublicationDto = {
  concierge: boolean
  seminar: boolean
  vacationRental: boolean
}

export type AdminLandingDestinationDto = {
  id: string
  city: EligibleLandingCityDto
  is_active: boolean
  pages: LocalLandingPageInput[]
  publication: LandingPublicationDto
  contentIssues: LandingContentIssue[]
  publicLodgingCount: number
  reviewCount: number
  reviews: import('./landing-reviews').LandingReviewDto[]
  created_at: string
  updated_at: string
}

export type PublicLocalLandingDto = {
  id: string
  city: EligibleLandingCityDto
  page: LocalLandingPageInput
  publication: LandingPublicationDto
  publicLodgingCount: number
}

export type PublishedLocalLandingSummaryDto = {
  id: string
  city: EligibleLandingCityDto
  publication: LandingPublicationDto
  publicLodgingCount: number
}
