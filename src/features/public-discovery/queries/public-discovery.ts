import type { Prisma } from '@prisma/client'
import { cache } from 'react'
import { isUsableAdminPhotoUrl } from '@/features/admin-pois/lib/admin-poi-rules'
import { haversineKm } from '@/features/geolocation/lib/user-location'
import { prisma } from '@/shared/lib/prisma'
import { getPoiDiscoveryEligibility } from '../lib/eligibility'
import type {
  DiscoveryCategory,
  DiscoveryCity,
  DiscoveryCitySummary,
  DiscoveryPoiCard,
  DiscoveryPoiDetail,
  DiscoveryTaxonomy,
  DiscoveryZone,
} from '../types'

const PRIMARY_RADIUS_KM = 15
const NEARBY_RADIUS_KM = 30
const ROUTE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const frenchNameCollator = new Intl.Collator('fr', { sensitivity: 'base' })

const discoveryPoiSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  address: true,
  latitude: true,
  longitude: true,
  phone: true,
  website: true,
  rating: true,
  rating_count: true,
  is_open_now: true,
  hours: true,
  photos: true,
  discovery_status: true,
  discovery_published_at: true,
  is_active: true,
  deleted_at: true,
  geocode_status: true,
  subcategory_id: true,
  city: {
    select: {
      id: true,
      name: true,
      slug: true,
      postal_code: true,
      department: true,
      region: true,
      latitude: true,
      longitude: true,
      is_active: true,
      deleted_at: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      sort_order: true,
      is_active: true,
      deleted_at: true,
    },
  },
  subcategory: {
    select: {
      id: true,
      name: true,
      slug: true,
      category_id: true,
      sort_order: true,
      is_active: true,
      deleted_at: true,
    },
  },
} satisfies Prisma.PointOfInterestSelect

type DiscoveryPoiRow = Prisma.PointOfInterestGetPayload<{
  select: typeof discoveryPoiSelect
}>

type DiscoveryRoute = {
  citySlug: string
  categorySlug?: string
  poiSlug?: string
}

type MappedPoi = {
  card: DiscoveryPoiCard
  row: DiscoveryPoiRow
  photos: string[]
}

function normalizeRouteSlug(value: string): string | null {
  const normalized = value.trim().toLowerCase()
  return ROUTE_SLUG_PATTERN.test(normalized) ? normalized : null
}

function buildDiscoveryWhere(route: DiscoveryRoute): Prisma.PointOfInterestWhereInput {
  return {
    discovery_status: 'PUBLISHED',
    discovery_published_at: { not: null },
    is_active: true,
    deleted_at: null,
    geocode_status: 'success',
    city: {
      slug: route.citySlug,
      is_active: true,
      deleted_at: null,
    },
    category: {
      is_active: true,
      deleted_at: null,
      ...(route.categorySlug ? { slug: route.categorySlug } : {}),
    },
    OR: [
      { subcategory_id: null },
      { subcategory: { is: { is_active: true, deleted_at: null } } },
    ],
    ...(route.poiSlug ? { slug: route.poiSlug } : {}),
  }
}

async function findDiscoveryRows(route: DiscoveryRoute): Promise<DiscoveryPoiRow[]> {
  return prisma.pointOfInterest.findMany({
    where: buildDiscoveryWhere(route),
    select: discoveryPoiSelect,
  })
}

function toCitySummary(row: DiscoveryPoiRow): DiscoveryCitySummary {
  return {
    name: row.city.name,
    slug: row.city.slug,
    postal_code: row.city.postal_code,
    department: row.city.department,
    region: row.city.region,
  }
}

function toTaxonomy(value: { id: string; name: string; slug: string }): DiscoveryTaxonomy {
  return { name: value.name, slug: value.slug }
}

function sanitizeWebsite(value: string | null): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : null
  } catch {
    return null
  }
}

function toPublicHours(value: Prisma.JsonValue | null): Readonly<Record<string, unknown>> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return { ...value }
}

function stableNameCompare(
  left: { name: string; slug: string },
  right: { name: string; slug: string },
): number {
  return frenchNameCollator.compare(left.name, right.name)
    || left.slug.localeCompare(right.slug)
}

function distanceAndZone(row: DiscoveryPoiRow): { distance: number; zone: DiscoveryZone } | null {
  if (
    !isValidLatitude(row.city.latitude)
    || !isValidLongitude(row.city.longitude)
    || !isValidLatitude(row.latitude)
    || !isValidLongitude(row.longitude)
  ) {
    return null
  }

  const rawDistance = haversineKm(
    row.city.latitude,
    row.city.longitude,
    row.latitude,
    row.longitude,
  )
  if (!Number.isFinite(rawDistance) || rawDistance < 0) return null

  // Geographic source values are floating point; normalizing sub-millimetre
  // noise keeps the exact 15 km and 30 km business boundaries deterministic.
  const distance = Math.round(rawDistance * 1_000_000_000) / 1_000_000_000
  if (distance <= PRIMARY_RADIUS_KM) return { distance, zone: 'primary' }
  if (distance <= NEARBY_RADIUS_KM) return { distance, zone: 'nearby' }
  return null
}

function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90
}

function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180
}

function matchesRoute(row: DiscoveryPoiRow, route: DiscoveryRoute): boolean {
  return row.city.slug === route.citySlug
    && (!route.categorySlug || row.category.slug === route.categorySlug)
    && (!route.poiSlug || row.slug === route.poiSlug)
}

function mapEligiblePoi(row: DiscoveryPoiRow, route: DiscoveryRoute): MappedPoi | null {
  if (
    !matchesRoute(row, route)
    || row.discovery_status !== 'PUBLISHED'
    || !row.discovery_published_at
    || (row.subcategory_id !== null && !row.subcategory)
    || (row.subcategory && row.subcategory.category_id !== row.category.id)
    || !row.name.trim()
    || !ROUTE_SLUG_PATTERN.test(row.slug)
  ) {
    return null
  }

  const rawPhotos = Array.isArray(row.photos)
    ? row.photos.filter((photo): photo is string => typeof photo === 'string')
    : []
  const eligibility = getPoiDiscoveryEligibility({
    is_active: row.is_active,
    deleted_at: row.deleted_at,
    description: row.description,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    geocode_status: row.geocode_status,
    phone: row.phone,
    website: row.website,
    photos: rawPhotos,
    city: row.city,
    category: row.category,
    subcategory: row.subcategory,
  })
  if (!eligibility.eligible) return null

  const metric = distanceAndZone(row)
  if (!metric) return null

  const photos = rawPhotos.filter(isUsableAdminPhotoUrl)
  const hero = photos[0]
  if (!hero) return null

  return {
    row,
    photos,
    card: {
      name: row.name.trim(),
      slug: row.slug,
      address: row.address.trim(),
      latitude: row.latitude,
      longitude: row.longitude,
      rating: Number.isFinite(row.rating) ? row.rating : null,
      rating_count: Number.isInteger(row.rating_count) && row.rating_count >= 0
        ? row.rating_count
        : 0,
      is_open_now: typeof row.is_open_now === 'boolean' ? row.is_open_now : null,
      photo_url: hero,
      category: toTaxonomy(row.category),
      subcategory: row.subcategory ? toTaxonomy(row.subcategory) : null,
      distance_km: metric.distance,
      zone: metric.zone,
    },
  }
}

function sortedMappedPois(rows: DiscoveryPoiRow[], route: DiscoveryRoute): MappedPoi[] {
  return rows
    .map(row => mapEligiblePoi(row, route))
    .filter((poi): poi is MappedPoi => poi !== null)
    .sort((left, right) => {
      const zoneOrder = (left.card.zone === 'primary' ? 0 : 1)
        - (right.card.zone === 'primary' ? 0 : 1)
      return zoneOrder
        || left.card.distance_km - right.card.distance_km
        || stableNameCompare(left.card, right.card)
    })
}

export const getDiscoveryCity: (citySlug: string) => Promise<DiscoveryCity | null> = cache(
  async (citySlug: string): Promise<DiscoveryCity | null> => {
    const normalizedCitySlug = normalizeRouteSlug(citySlug)
    if (!normalizedCitySlug) return null

    const route = { citySlug: normalizedCitySlug }
    const mapped = sortedMappedPois(await findDiscoveryRows(route), route)
    const first = mapped[0]
    if (!first) return null

    const categoryGroups = new Map<string, MappedPoi[]>()
    for (const poi of mapped) {
      const group = categoryGroups.get(poi.row.category.id) ?? []
      group.push(poi)
      categoryGroups.set(poi.row.category.id, group)
    }

    const categories = [...categoryGroups.values()]
      .map(group => {
        const category = group[0]!.row.category
        return {
          ...toTaxonomy(category),
          icon: category.icon,
          sort_order: category.sort_order,
          poi_count: group.length,
          pois: group.map(poi => poi.card),
        }
      })
      .sort((left, right) => left.sort_order - right.sort_order || stableNameCompare(left, right))

    return { ...toCitySummary(first.row), categories }
  },
)

export const getDiscoveryCategory: (
  citySlug: string,
  categorySlug: string,
) => Promise<DiscoveryCategory | null> = cache(
  async (citySlug: string, categorySlug: string): Promise<DiscoveryCategory | null> => {
    const normalizedCitySlug = normalizeRouteSlug(citySlug)
    const normalizedCategorySlug = normalizeRouteSlug(categorySlug)
    if (!normalizedCitySlug || !normalizedCategorySlug) return null

    const route = {
      citySlug: normalizedCitySlug,
      categorySlug: normalizedCategorySlug,
    }
    const mapped = sortedMappedPois(await findDiscoveryRows(route), route)
    const first = mapped[0]
    if (!first) return null

    const subcategories = new Map<string, NonNullable<DiscoveryPoiRow['subcategory']>>()
    for (const poi of mapped) {
      if (poi.row.subcategory) subcategories.set(poi.row.subcategory.id, poi.row.subcategory)
    }
    const category = first.row.category

    return {
      ...toTaxonomy(category),
      icon: category.icon,
      sort_order: category.sort_order,
      city: toCitySummary(first.row),
      subcategories: [...subcategories.values()]
        .sort((left, right) => left.sort_order - right.sort_order || stableNameCompare(left, right))
        .map(toTaxonomy),
      pois: mapped.map(poi => poi.card),
    }
  },
)

export const getDiscoveryPoi: (
  citySlug: string,
  categorySlug: string,
  poiSlug: string,
) => Promise<DiscoveryPoiDetail | null> = cache(
  async (
    citySlug: string,
    categorySlug: string,
    poiSlug: string,
  ): Promise<DiscoveryPoiDetail | null> => {
    const normalizedCitySlug = normalizeRouteSlug(citySlug)
    const normalizedCategorySlug = normalizeRouteSlug(categorySlug)
    const normalizedPoiSlug = normalizeRouteSlug(poiSlug)
    if (!normalizedCitySlug || !normalizedCategorySlug || !normalizedPoiSlug) return null

    const route = {
      citySlug: normalizedCitySlug,
      categorySlug: normalizedCategorySlug,
      poiSlug: normalizedPoiSlug,
    }
    const mapped = sortedMappedPois(await findDiscoveryRows(route), route)[0]
    if (!mapped) return null

    const { photo_url: heroPhotoUrl, ...detailCard } = mapped.card

    return {
      ...detailCard,
      description: mapped.row.description!.trim(),
      phone: mapped.row.phone?.trim() || null,
      website: sanitizeWebsite(mapped.row.website),
      hours: toPublicHours(mapped.row.hours),
      photos: mapped.photos,
      hero_photo_url: heroPhotoUrl,
      city: toCitySummary(mapped.row),
    }
  },
)
