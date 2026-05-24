export interface FeaturedPoiInput {
  poi_id: string
  owner_note?: string | null
  sort_order: number
}

export interface FeaturedPoiResponse {
  poi_id: string
  category_id: string
  owner_note: string | null
  sort_order: number
}

export interface LodgingCustomizationInput {
  welcome_message?: string | null
  category_order: string[]
  featured_pois: FeaturedPoiInput[]
}

export interface LodgingCustomizationResponse {
  lodging_id: string
  welcome_message: string | null
  category_order: string[]
  featured_pois: FeaturedPoiResponse[]
  ignored_category_slugs: string[]
}

export type GuideCustomizationErrorCode =
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'FEATURED_POI_LIMIT_EXCEEDED'
  | 'INVALID_FEATURED_POI'

export class GuideCustomizationError extends Error {
  constructor(readonly code: GuideCustomizationErrorCode, message: string) {
    super(message)
    this.name = 'GuideCustomizationError'
  }
}
