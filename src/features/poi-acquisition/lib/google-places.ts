import { googleReviewExpiry, sanitizeGoogleReviewPayload } from './google-policy'
import { mapRegularOpeningHoursToPoiHours } from './google-hours'
import type { GooglePolicyResult, GoogleReviewPayload } from '../types'
import type { PoiHours } from '@/features/categories/types'

type GoogleTextSearchResponse = {
  places?: unknown[]
}

export type GooglePlaceCandidate = {
  name: string
  address: string
  phone: string | null
  website: string | null
  google_place_id: string
  review_payload: GoogleReviewPayload | null
  google_review_expires_at: Date | null
  hours: PoiHours | null
}

const PLACES_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.regularOpeningHours',
].join(',')

const PLACES_MATCH_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.rating',
  'places.regularOpeningHours',
].join(',')

export async function searchGooglePlaceCandidates(params: {
  cityName: string
  postalCode: string
  categoryName: string
  latitude: number
  longitude: number
}): Promise<GooglePlaceCandidate[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY not set')

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': PLACES_FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: `${params.categoryName} ${params.cityName} ${params.postalCode}`,
      languageCode: 'fr',
      maxResultCount: 20,
      locationBias: {
        circle: {
          center: { latitude: params.latitude, longitude: params.longitude },
          radius: 15000,
        },
      },
    }),
  })

  if (!response.ok) throw new Error(`Google Places search failed: ${response.status}`)

  const data = (await response.json()) as GoogleTextSearchResponse
  return (data.places ?? []).map(mapGooglePlaceCandidate).filter((candidate): candidate is GooglePlaceCandidate => candidate !== null)
}

export async function findGooglePlaceMatch(params: {
  name: string
  address: string
}): Promise<(GooglePolicyResult & { google_review_expires_at: Date | null; hours: PoiHours | null }) | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return null

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': PLACES_MATCH_FIELD_MASK,
    },
    body: JSON.stringify({ textQuery: `${params.name} ${params.address}`, languageCode: 'fr' }),
  })

  if (!response.ok) return null

  const data = (await response.json()) as GoogleTextSearchResponse
  const firstPlace = data.places?.[0]
  if (!firstPlace || typeof firstPlace !== 'object') return null

  const sanitized = sanitizeGoogleReviewPayload(firstPlace)
  if (!sanitized.google_place_id) return null

  const hours = isRecord(firstPlace)
    ? mapRegularOpeningHoursToPoiHours(firstPlace.regularOpeningHours)
    : null

  return {
    ...sanitized,
    google_review_expires_at: sanitized.review_payload ? googleReviewExpiry() : null,
    hours,
  }
}

function mapGooglePlaceCandidate(place: unknown): GooglePlaceCandidate | null {
  if (!isRecord(place)) return null

  const sanitized = sanitizeGoogleReviewPayload(place)
  if (!sanitized.google_place_id) return null

  const name = displayNameText(place.displayName)
  const address = typeof place.formattedAddress === 'string' ? place.formattedAddress : null
  if (!name || !address) return null

  return {
    name,
    address,
    phone: firstString(place.nationalPhoneNumber, place.internationalPhoneNumber),
    website: typeof place.websiteUri === 'string' ? place.websiteUri : null,
    google_place_id: sanitized.google_place_id,
    review_payload: sanitized.review_payload,
    google_review_expires_at: sanitized.review_payload ? googleReviewExpiry() : null,
    hours: mapRegularOpeningHoursToPoiHours(place.regularOpeningHours),
  }
}

function displayNameText(value: unknown): string | null {
  if (!isRecord(value)) return null
  return typeof value.text === 'string' && value.text.trim().length > 0 ? value.text : null
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value
  }
  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
