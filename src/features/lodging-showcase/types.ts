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
  title: string
  short_description: string
  property_type: string
  max_guests: number
  public_area_label: string | null
  cover_photo_url: string | null
  amenities: Array<{ code: string; label: string }>
  href: string
}

export type PublicLodgingDetailDto = PublicLodgingCardDto & {
  description: string
  bedroom_count: number | null
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
