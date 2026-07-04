import { googleReviewExpiry, sanitizeGoogleReviewPayload } from './google-policy'
import { mapRegularOpeningHoursToPoiHours } from './google-hours'
import type { GooglePolicyResult, GoogleReviewPayload } from '../types'
import type { PoiHours } from '@/features/categories/types'

type GoogleTextSearchResponse = {
  places?: unknown[]
}

type GooglePlaceSearchQuery = {
  textQuery: string
  query_subcategory_name: string | null
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
  query_subcategory_name: string | null
}

const ACQUISITION_SEARCH_RADIUS_METERS = 30000

const PLACES_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.regularOpeningHours',
].join(',')

const PLACES_MATCH_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.rating',
  'places.userRatingCount',
  'places.regularOpeningHours',
].join(',')

export async function searchGooglePlaceCandidates(params: {
  cityName: string
  postalCode: string
  categoryName: string
  subcategoryNames?: string[]
  sourceUrl?: string | null
  latitude: number
  longitude: number
}): Promise<GooglePlaceCandidate[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY not set')

  const byPlaceId = new Map<string, GooglePlaceCandidate>()

  for (const query of buildGooglePlaceSearchQueries(params)) {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': PLACES_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query.textQuery,
        languageCode: 'fr',
        maxResultCount: 20,
        locationBias: {
          circle: {
            center: { latitude: params.latitude, longitude: params.longitude },
            radius: ACQUISITION_SEARCH_RADIUS_METERS,
          },
        },
      }),
    })

    if (!response.ok) throw new Error(`Google Places search failed: ${response.status}`)

    const data = (await response.json()) as GoogleTextSearchResponse
    for (const place of data.places ?? []) {
      const candidate = mapGooglePlaceCandidate(place, query.query_subcategory_name)
      if (!candidate) continue

      const existing = byPlaceId.get(candidate.google_place_id)
      if (!existing) {
        byPlaceId.set(candidate.google_place_id, candidate)
      } else if (!existing.query_subcategory_name && candidate.query_subcategory_name) {
        byPlaceId.set(candidate.google_place_id, {
          ...existing,
          query_subcategory_name: candidate.query_subcategory_name,
        })
      }
    }
  }

  return Array.from(byPlaceId.values())
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

function buildGooglePlaceSearchQueries(params: {
  cityName: string
  categoryName: string
  subcategoryNames?: string[]
  sourceUrl?: string | null
}): GooglePlaceSearchQuery[] {
  const queries: GooglePlaceSearchQuery[] = [
    { textQuery: `${params.categoryName} ${params.cityName}`, query_subcategory_name: null },
  ]
  const seen = new Set(queries.map(query => normalizeQueryKey(query.textQuery)))

  for (const subcategoryName of params.subcategoryNames ?? []) {
    if (!isUsefulSubcategoryQuery(subcategoryName)) continue

    const textQuery = `${subcategoryName} ${params.cityName}`
    const key = normalizeQueryKey(textQuery)
    if (seen.has(key)) continue

    seen.add(key)
    queries.push({ textQuery, query_subcategory_name: subcategoryName })
  }

  const sourceQuery = queryFromSourceUrl(params.sourceUrl)
  if (sourceQuery) {
    const key = normalizeQueryKey(sourceQuery)
    if (!seen.has(key)) {
      queries.push({ textQuery: sourceQuery, query_subcategory_name: null })
    }
  }

  return queries
}

function isUsefulSubcategoryQuery(name: string): boolean {
  const key = normalizeQueryKey(name)
  if (!key) return false
  return ![
    'toutes',
    'ouvert maintenant',
    'recommande par l hote',
    'recommande par hote',
  ].includes(key)
}

function queryFromSourceUrl(sourceUrl: string | null | undefined): string | null {
  if (!sourceUrl) return null
  try {
    const hostname = new URL(sourceUrl).hostname.replace(/^www\./, '').trim()
    return hostname.length > 0 ? hostname : null
  } catch {
    return null
  }
}

function normalizeQueryKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function mapGooglePlaceCandidate(place: unknown, querySubcategoryName: string | null): GooglePlaceCandidate | null {
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
    query_subcategory_name: querySubcategoryName,
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
