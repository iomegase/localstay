export interface FeaturedPoiInput {
  poi_id: string
  sort_order: number
}

export interface FeaturedPoiResponse {
  poi_id: string
  category_id: string
  sort_order: number
}

export interface PracticalInfoFields {
  cover_photo_url: string | null
  lodging_address: string | null
  wifi_ssid: string | null
  wifi_password: string | null
  parking_info: string | null
  equipment_info: string | null
  checkout_instructions: string | null
  trash_info: string | null
  trash_location: string | null
  house_rules: string | null
  emergency_contacts: string | null
  useful_services: string | null
}

export const PRACTICAL_INFO_KEYS = [
  'cover_photo_url',
  'lodging_address',
  'wifi_ssid',
  'wifi_password',
  'parking_info',
  'equipment_info',
  'checkout_instructions',
  'trash_info',
  'trash_location',
  'house_rules',
  'emergency_contacts',
  'useful_services',
] as const satisfies ReadonlyArray<keyof PracticalInfoFields>

export type PracticalInfoInput = Partial<PracticalInfoFields>

export interface LodgingCustomizationInput extends PracticalInfoInput {
  welcome_message?: string | null
  category_order: string[]
  featured_pois: FeaturedPoiInput[]
}

export interface LodgingCustomizationResponse extends PracticalInfoFields {
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
