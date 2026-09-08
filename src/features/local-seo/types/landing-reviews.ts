export const LANDING_REVIEW_SOURCES = ['AIRBNB', 'DIRECT'] as const

export type LandingReviewSource = (typeof LANDING_REVIEW_SOURCES)[number]

export type LandingReviewDto = {
  id: string
  destination_id: string | null
  destination_slug: string
  author: string
  quote: string
  stay_date: string | null
  source: LandingReviewSource
  rating: number | null
  sort_order: number
  is_active: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type AdminLandingPageDto = {
  slug: string
  name: string
  published: boolean
  reviews: LandingReviewDto[]
}
