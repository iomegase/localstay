import { googleReviewExpiry, sanitizeGoogleReviewPayload } from './google-policy'
import { mapRegularOpeningHoursToPoiHours } from './google-hours'
import type { GooglePolicyResult, GoogleReviewPayload } from '../types'
import type { PoiHours } from '@/features/categories/types'

type GoogleTextSearchResponse = {
  places?: unknown[]
  nextPageToken?: unknown
}

type GooglePlaceSearchQuery = {
  textQuery: string
  query_subcategory_name: string | null
}

export type GoogleBusinessStatus = 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY'

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
  /** Spec 066 AC-02 : statut d'ouverture Google, null si inconnu. */
  business_status: GoogleBusinessStatus | null
  /** Spec 066 BR-01 : position Google, utilisée seulement pour le filtre village. */
  location: { latitude: number; longitude: number } | null
}

const ACQUISITION_SEARCH_RADIUS_METERS = 30000
// Spec 066 BR-04 : plafond Google de 60 résultats par requête.
const MAX_PAGES_PER_QUERY = 3
const NAME_SEARCH_RESULT_LIMIT = 5

const PLACE_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'websiteUri',
  'rating',
  'userRatingCount',
  'regularOpeningHours',
  'businessStatus',
  'location',
]

const PLACES_FIELD_MASK = [
  ...PLACE_FIELDS.map(field => `places.${field}`),
  'nextPageToken',
].join(',')

const PLACE_DETAILS_FIELD_MASK = PLACE_FIELDS.join(',')

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
    const places = await fetchAllTextSearchPages(apiKey, {
      textQuery: query.textQuery,
      languageCode: 'fr',
      pageSize: 20,
      locationBias: {
        circle: {
          center: { latitude: params.latitude, longitude: params.longitude },
          radius: ACQUISITION_SEARCH_RADIUS_METERS,
        },
      },
    })

    for (const place of places) {
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

/** Spec 066 AC-03-01 : suit `nextPageToken` jusqu'à MAX_PAGES_PER_QUERY pages. */
async function fetchAllTextSearchPages(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<unknown[]> {
  const places: unknown[] = []
  let pageToken: string | undefined

  for (let page = 0; page < MAX_PAGES_PER_QUERY; page += 1) {
    const data = await postTextSearch(apiKey, pageToken ? { ...body, pageToken } : body)
    places.push(...(data.places ?? []))
    pageToken = typeof data.nextPageToken === 'string' && data.nextPageToken ? data.nextPageToken : undefined
    if (!pageToken) break
  }

  return places
}

async function postTextSearch(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<GoogleTextSearchResponse> {
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': PLACES_FIELD_MASK,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) throw new Error(`Google Places search failed: ${response.status}`)
  return (await response.json()) as GoogleTextSearchResponse
}

/**
 * Spec 066 AC-04-01 : recherche d'un établissement précis par son nom. Contrairement
 * à la recherche par catégorie, elle renvoie aussi les lieux fermés temporairement.
 */
export async function searchGooglePlacesByName(params: {
  query: string
  cityName: string
  latitude: number
  longitude: number
}): Promise<GooglePlaceCandidate[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY not set')

  const data = await postTextSearch(apiKey, {
    textQuery: `${params.query} ${params.cityName}`,
    languageCode: 'fr',
    pageSize: NAME_SEARCH_RESULT_LIMIT,
    locationBias: {
      circle: {
        center: { latitude: params.latitude, longitude: params.longitude },
        radius: ACQUISITION_SEARCH_RADIUS_METERS,
      },
    },
  })

  return (data.places ?? [])
    .map(place => mapGooglePlaceCandidate(place, null))
    .filter((candidate): candidate is GooglePlaceCandidate => candidate !== null)
    .slice(0, NAME_SEARCH_RESULT_LIMIT)
}

/** Spec 066 AC-04-02 : détail d'un lieu choisi par l'admin. */
export async function getGooglePlaceCandidate(googlePlaceId: string): Promise<GooglePlaceCandidate | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY not set')

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(googlePlaceId)}?languageCode=fr`,
    {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': PLACE_DETAILS_FIELD_MASK,
      },
    },
  )

  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Google Places details failed: ${response.status}`)
  return mapGooglePlaceCandidate(await response.json(), null)
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
    business_status: businessStatus(place.businessStatus),
    location: placeLocation(place.location),
  }
}

function businessStatus(value: unknown): GoogleBusinessStatus | null {
  return value === 'OPERATIONAL' || value === 'CLOSED_TEMPORARILY' || value === 'CLOSED_PERMANENTLY'
    ? value
    : null
}

function placeLocation(value: unknown): { latitude: number; longitude: number } | null {
  if (!isRecord(value)) return null
  const { latitude, longitude } = value
  return typeof latitude === 'number' && Number.isFinite(latitude)
    && typeof longitude === 'number' && Number.isFinite(longitude)
    ? { latitude, longitude }
    : null
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
