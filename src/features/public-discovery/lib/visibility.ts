import { isUsableAdminPhotoUrl } from '@/features/admin-pois/lib/admin-poi-rules'
import { haversineKm } from '@/features/geolocation/lib/user-location'
import { getPoiDiscoveryEligibility } from './eligibility'
import type { DiscoveryZone } from '../types'

const PRIMARY_RADIUS_KM = 15
const NEARBY_RADIUS_KM = 30
const DISCOVERY_ROUTE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

type VisibilityCandidate = {
  name: string
  slug: string
  description: string | null
  address: string
  latitude: number
  longitude: number
  phone: string | null
  website: string | null
  photos: string[]
  discovery_status: string
  discovery_published_at: Date | null
  is_active: boolean
  deleted_at: Date | null
  geocode_status: string
  subcategory_id: string | null
  city: {
    slug: string
    latitude: number
    longitude: number
    is_active: boolean
    deleted_at: Date | null
  }
  category: {
    id: string
    slug: string
    is_active: boolean
    deleted_at: Date | null
  }
  subcategory: {
    category_id: string
    is_active: boolean
    deleted_at: Date | null
  } | null
}

export type DiscoveryPoiVisibility = {
  photos: string[]
  distanceKm: number
  zone: DiscoveryZone
}

export function isCanonicalDiscoverySlug(value: string): boolean {
  return DISCOVERY_ROUTE_SLUG_PATTERN.test(value)
}

export function normalizeUsableDiscoveryPhotos(values: string[]): string[] {
  const photos: string[] = []
  const seen = new Set<string>()

  for (const value of values) {
    const trimmed = value.trim()
    if (!isUsableAdminPhotoUrl(trimmed)) continue
    const canonical = new URL(trimmed).toString()
    if (seen.has(canonical)) continue
    seen.add(canonical)
    photos.push(canonical)
  }

  return photos
}

export function getDiscoveryZone(distanceKm: number): DiscoveryZone | null {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return null
  if (distanceKm <= PRIMARY_RADIUS_KM) return 'primary'
  if (distanceKm <= NEARBY_RADIUS_KM) return 'nearby'
  return null
}

export function getDiscoveryPoiVisibility(
  candidate: VisibilityCandidate,
): DiscoveryPoiVisibility | null {
  if (
    candidate.discovery_status !== 'PUBLISHED'
    || !candidate.discovery_published_at
    || !candidate.name.trim()
    || !isCanonicalDiscoverySlug(candidate.city.slug)
    || !isCanonicalDiscoverySlug(candidate.category.slug)
    || !isCanonicalDiscoverySlug(candidate.slug)
    || (candidate.subcategory_id !== null && !candidate.subcategory)
    || (candidate.subcategory && candidate.subcategory.category_id !== candidate.category.id)
  ) {
    return null
  }

  const photos = normalizeUsableDiscoveryPhotos(candidate.photos)
  const eligibility = getPoiDiscoveryEligibility({
    is_active: candidate.is_active,
    deleted_at: candidate.deleted_at,
    description: candidate.description,
    address: candidate.address,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    geocode_status: candidate.geocode_status,
    phone: candidate.phone,
    website: candidate.website,
    photos,
    city: candidate.city,
    category: candidate.category,
    subcategory: candidate.subcategory,
  })
  if (!eligibility.eligible) return null

  if (
    !isValidLatitude(candidate.city.latitude)
    || !isValidLongitude(candidate.city.longitude)
    || !isValidLatitude(candidate.latitude)
    || !isValidLongitude(candidate.longitude)
  ) {
    return null
  }

  const distanceKm = haversineKm(
    candidate.city.latitude,
    candidate.city.longitude,
    candidate.latitude,
    candidate.longitude,
  )
  const zone = getDiscoveryZone(distanceKm)
  return zone ? { photos, distanceKm, zone } : null
}

function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90
}

function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180
}
