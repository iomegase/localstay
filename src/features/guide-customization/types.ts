export type { TrashBin, TrashBinInput } from './lib/trash-bins'
import type { TrashBin, TrashBinInput } from './lib/trash-bins'

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

export interface OtherCityPoiSelection {
  poi_id: string
  name: string
  category_name: string
  city_slug: string
  city_name: string
  owner_note: string | null
}

export interface PracticalBlockInput {
  id?: string
  title: string
  body: string | null
  icon: string
  photo_url: string | null
  video_url: string | null
  sort_order: number
}

export interface PracticalBlockResponse {
  id: string
  title: string
  body: string | null
  icon: string
  photo_url: string | null
  video_url: string | null
  sort_order: number
}

export interface ArrivalInstructionInput {
  id?: string
  title?: string | null
  text: string
  video_url: string | null
  photos: string[]
  sort_order: number
}

export interface ArrivalInstructionResponse {
  id: string
  title: string | null
  text: string
  video_url: string | null
  photos: string[]
  sort_order: number
}

export interface PracticalInfoFields {
  cover_photo_url: string | null
  presentation_video_url: string | null
  lodging_address: string | null
  wifi_ssid: string | null
  wifi_password: string | null
  checkout_instructions: string | null
  trash_info: string | null
  trash_location: string | null
  house_rules: string | null
  emergency_contacts: string | null
  useful_services: string | null
}

export const PRACTICAL_INFO_KEYS = [
  'cover_photo_url',
  'presentation_video_url',
  'lodging_address',
  'wifi_ssid',
  'wifi_password',
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
  practical_blocks?: PracticalBlockInput[]
  arrival_instructions?: ArrivalInstructionInput[]
  trash_bins?: TrashBinInput[]
}

export interface LodgingCustomizationResponse extends PracticalInfoFields {
  lodging_id: string
  welcome_message: string | null
  category_order: string[]
  featured_pois: FeaturedPoiResponse[]
  ignored_category_slugs: string[]
  practical_blocks: PracticalBlockResponse[]
  arrival_instructions: ArrivalInstructionResponse[]
  trash_bins: TrashBin[]
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
