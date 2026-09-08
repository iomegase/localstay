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
