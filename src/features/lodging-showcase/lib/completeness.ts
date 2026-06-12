import type { CompletenessResult } from '../types'

type ProfileLike = {
  title: string | null
  short_description: string | null
  description: string | null
  property_type: string | null
  max_guests: number | null
  photos: Array<{ url: string; alt: string; is_cover: boolean; room_type?: string | null }>
  amenities: Array<{ code: string; label: string }>
  content_rights_confirmed_at?: Date | null
  precise_location_public?: boolean | null
  public_latitude?: number | null
  public_longitude?: number | null
}

export function evaluateProfileCompleteness(profile: ProfileLike): CompletenessResult {
  const missingFields: string[] = []

  if (!profile.title || profile.title.trim().length < 5) missingFields.push('title')
  if (!profile.short_description || profile.short_description.trim().length < 40) missingFields.push('short_description')
  if (!profile.description || profile.description.trim().length < 80) missingFields.push('description')
  if (!profile.property_type) missingFields.push('property_type')
  if (!profile.max_guests || profile.max_guests < 1) missingFields.push('max_guests')
  if (profile.photos.length < 1) missingFields.push('photos')
  if (!profile.photos.some(photo => photo.is_cover)) missingFields.push('cover_photo')
  if (profile.amenities.length < 3) missingFields.push('amenities')
  if (!profile.content_rights_confirmed_at) missingFields.push('content_rights_confirmation')

  const warnings: string[] = []
  if (profile.photos.length < 5) warnings.push('seo_photo_count')
  if (profile.description && profile.description.trim().length < 200) warnings.push('editorial_description_length')
  if (profile.description && profile.description.trim().length < 400) warnings.push('seo_description_length')

  return { canSubmitForReview: missingFields.length === 0, missingFields, warnings }
}

export function canEmitVacationRentalSchema(profile: ProfileLike): boolean {
  const roomTypes = new Set(profile.photos.map(photo => photo.room_type).filter(Boolean))

  return Boolean(
    profile.precise_location_public &&
      typeof profile.public_latitude === 'number' &&
      typeof profile.public_longitude === 'number' &&
      profile.photos.length >= 8 &&
      roomTypes.has('bedroom') &&
      roomTypes.has('bathroom') &&
      roomTypes.has('common_area'),
  )
}
