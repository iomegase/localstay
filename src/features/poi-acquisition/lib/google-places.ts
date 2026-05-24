import { googleReviewExpiry, sanitizeGoogleReviewPayload } from './google-policy'
import type { GooglePolicyResult } from '../types'

type GoogleTextSearchResponse = {
  places?: unknown[]
}

export async function findGooglePlaceMatch(params: {
  name: string
  address: string
}): Promise<(GooglePolicyResult & { google_review_expires_at: Date | null }) | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return null

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating',
    },
    body: JSON.stringify({ textQuery: `${params.name} ${params.address}`, languageCode: 'fr' }),
  })

  if (!response.ok) return null

  const data = (await response.json()) as GoogleTextSearchResponse
  const firstPlace = data.places?.[0]
  if (!firstPlace || typeof firstPlace !== 'object') return null

  const sanitized = sanitizeGoogleReviewPayload(firstPlace)
  if (!sanitized.google_place_id) return null

  return {
    ...sanitized,
    google_review_expires_at: sanitized.review_payload ? googleReviewExpiry() : null,
  }
}
