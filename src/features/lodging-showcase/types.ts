export type ExternalBookingPlatform = 'airbnb' | 'booking' | 'other_verified'
export type LodgingPublicationStatus = 'draft' | 'review' | 'published' | 'archived'
export type LodgingSourceMetadataStatus = 'not_checked' | 'url_only' | 'unavailable' | 'blocked'
export type LodgingRewriteStatus = 'not_requested' | 'requested' | 'generated' | 'accepted' | 'rejected' | 'failed'
export type LodgingPhotoRoomType = 'bedroom' | 'bathroom' | 'common_area' | 'exterior' | 'kitchen' | 'other'

export type ExternalListingDetection = {
  platform: ExternalBookingPlatform
  identifier: string | null
  metadataStatus: Exclude<LodgingSourceMetadataStatus, 'not_checked'>
}

export type CompletenessResult = {
  canSubmitForReview: boolean
  missingFields: string[]
  warnings: string[]
}

export type PublicLodgingCardDto = {
  id: string
  slug: string
  city_slug: string
  title: string
  short_description: string
  property_type: string
  max_guests: number
  bedroom_count: number | null
  public_area_label: string | null
  cover_photo_url: string | null
  amenities: string[]
  href: string
}

export type PublicLodgingDetailDto = PublicLodgingCardDto & {
  city_name: string
  city_region: string | null
  description: string
  bathroom_count: number | null
  bed_count: number | null
  surface_m2: number | null
  precise_location_public: boolean
  public_latitude: number | null
  public_longitude: number | null
  external_booking_url: string | null
  external_booking_platform: ExternalBookingPlatform | null
  public_contact_enabled: boolean
  photos: Array<{ id: string; url: string; alt: string; room_type: string | null; sort_order: number; is_cover: boolean }>
  owner_recommendations: Array<{ id: string; name: string; slug: string; category_slug: string; photo_url: string | null }>
}

export type OwnerLodgingAmenityDto = {
  id: string | null
  code: string
  label: string
  sort_order: number
  availability: 'included' | 'on_request'
}

export type OwnerLodgingFaqItemDto = {
  id: string | null
  question: string
  answer: string
  sort_order: number
}

export type OwnerLodgingPhotoDto = {
  id: string | null
  url: string
  alt: string
  room_type: LodgingPhotoRoomType | null
  room_label: string | null
  sort_order: number
  is_cover: boolean
}

export type OwnerLodgingPublicProfileDto = {
  id: string | null
  lodging_id: string
  city_id: string
  slug: string | null
  publication_status: LodgingPublicationStatus
  title: string
  short_description: string
  description: string
  property_type: string
  max_guests: number
  bedroom_count: number | null
  bathroom_count: number | null
  bed_count: number | null
  surface_m2: number | null
  public_area_label: string | null
  precise_location_public: boolean
  public_latitude: number | null
  public_longitude: number | null
  external_booking_url: string | null
  external_booking_platform: ExternalBookingPlatform | null
  public_contact_enabled: boolean
  source_listing_url: string | null
  source_listing_platform: ExternalBookingPlatform | null
  source_listing_identifier: string | null
  source_metadata_status: LodgingSourceMetadataStatus
  source_description_text: string | null
  content_rights_confirmed_at: string | null
  content_rights_confirmed_by_user_id: string | null
  content_rights_statement_version: string | null
  rewrite_status: LodgingRewriteStatus
  rewrite_suggestion: string | null
  rewrite_generated_at: string | null
  rewrite_provider: string | null
  seo_title: string | null
  seo_description: string | null
  photos: OwnerLodgingPhotoDto[]
  amenities: OwnerLodgingAmenityDto[]
  faq: OwnerLodgingFaqItemDto[]
}

export type OwnerLodgingShowcasePageData = {
  lodging: {
    id: string
    name: string
    city: {
      id: string
      name: string
      slug: string
    }
  }
  profile: OwnerLodgingPublicProfileDto
}
