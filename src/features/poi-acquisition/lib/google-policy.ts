import type { GooglePolicyResult, GoogleReviewPayload } from '../types'

export const GOOGLE_REVIEW_TTL_DAYS = 30

type GooglePlaceLike = {
  id?: unknown
  place_id?: unknown
  displayName?: unknown
  formattedAddress?: unknown
  rating?: unknown
  userRatingCount?: unknown
}

export function googleReviewExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + GOOGLE_REVIEW_TTL_DAYS * 24 * 60 * 60 * 1000)
}

export function sanitizeGoogleReviewPayload(place: GooglePlaceLike): GooglePolicyResult {
  const rawPlaceId = typeof place.id === 'string' ? place.id : place.place_id
  const googlePlaceId = typeof rawPlaceId === 'string' && rawPlaceId.length > 0 ? rawPlaceId : null
  if (!googlePlaceId) return { google_place_id: null, review_payload: null }

  const reviewPayload: GoogleReviewPayload = { attribution: 'Google Maps' }

  if (isDisplayName(place.displayName)) {
    reviewPayload.displayName = { text: place.displayName.text }
  }
  if (typeof place.formattedAddress === 'string') {
    reviewPayload.formattedAddress = place.formattedAddress
  }
  if (typeof place.rating === 'number') {
    reviewPayload.rating = place.rating
  }
  if (typeof place.userRatingCount === 'number') {
    reviewPayload.userRatingCount = place.userRatingCount
  }

  return { google_place_id: googlePlaceId, review_payload: reviewPayload }
}

function isDisplayName(value: unknown): value is { text: string } {
  return typeof value === 'object' && value !== null && typeof Reflect.get(value, 'text') === 'string'
}
