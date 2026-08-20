import 'server-only'

import type { Prisma } from '@prisma/client'
import { cache } from 'react'
import { computeIsOpenNow } from '@/features/categories/lib/is-open-now'
import type { DayHours, PoiHours } from '@/features/categories/types'
import { prisma } from '@/shared/lib/prisma'
import {
  getDiscoveryPoiVisibility,
  isCanonicalDiscoverySlug,
} from '../lib/visibility'
import type {
  DiscoveryCategory,
  DiscoveryCity,
  DiscoveryCitySummary,
  DiscoveryPoiCard,
  DiscoveryPoiDetail,
  DiscoveryTaxonomy,
} from '../types'

const frenchNameCollator = new Intl.Collator('fr', { sensitivity: 'base' })

const discoveryPoiListSelect = {
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

const discoveryPoiDetailSelect = {
  ...discoveryPoiListSelect,
  hours: true,
} satisfies Prisma.PointOfInterestSelect

type DiscoveryPoiRow = Prisma.PointOfInterestGetPayload<{
  select: typeof discoveryPoiListSelect
}>

type DiscoveryPoiDetailRow = Prisma.PointOfInterestGetPayload<{
  select: typeof discoveryPoiDetailSelect
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
  return isCanonicalDiscoverySlug(normalized) ? normalized : null
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

async function findDiscoveryRows<TSelect extends Prisma.PointOfInterestSelect>(
  route: DiscoveryRoute,
  options: { select: TSelect; take?: number },
): Promise<Array<Prisma.PointOfInterestGetPayload<{ select: TSelect }>>> {
  return prisma.pointOfInterest.findMany({
    where: buildDiscoveryWhere(route),
    select: options.select,
    ...(options.take ? { take: options.take } : {}),
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

const PUBLIC_HOUR_DAY_KEYS = ['0', '1', '2', '3', '4', '5', '6'] as const
const PUBLIC_OPEN_TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/
const PUBLIC_CLOSE_TIME_PATTERN = /^(?:(?:[01]\d|2[0-3]):[0-5]\d|24:00)$/

function toPublicHours(value: Prisma.JsonValue | null): PoiHours | null {
  if (!isRecord(value)) return null

  const hours: PoiHours = {}
  for (const key of PUBLIC_HOUR_DAY_KEYS) {
    const day = value[key]
    if (day === null) {
      hours[key] = null
      continue
    }
    if (!isRecord(day) || Object.keys(day).length !== 2) continue
    if (!Object.hasOwn(day, 'open') || !Object.hasOwn(day, 'close')) continue
    if (
      typeof day.open !== 'string'
      || typeof day.close !== 'string'
      || !PUBLIC_OPEN_TIME_PATTERN.test(day.open)
      || !PUBLIC_CLOSE_TIME_PATTERN.test(day.close)
    ) {
      continue
    }
    hours[key] = { open: day.open, close: day.close } satisfies DayHours
  }

  return Object.keys(hours).length > 0 ? hours : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stableNameCompare(
  left: { name: string; slug: string },
  right: { name: string; slug: string },
): number {
  return frenchNameCollator.compare(left.name, right.name)
    || left.slug.localeCompare(right.slug)
}

function matchesRoute(row: DiscoveryPoiRow, route: DiscoveryRoute): boolean {
  return row.city.slug === route.citySlug
    && (!route.categorySlug || row.category.slug === route.categorySlug)
    && (!route.poiSlug || row.slug === route.poiSlug)
}

function mapEligiblePoi(row: DiscoveryPoiRow, route: DiscoveryRoute): MappedPoi | null {
  if (!matchesRoute(row, route)) return null

  const photos = Array.isArray(row.photos)
    ? row.photos.filter((photo): photo is string => typeof photo === 'string')
    : []
  const visibility = getDiscoveryPoiVisibility({ ...row, photos })
  if (!visibility) return null

  const hero = visibility.photos[0]
  if (!hero) return null

  return {
    row,
    photos: visibility.photos,
    card: {
      name: row.name.trim(),
      slug: row.slug,
      address: row.address.trim(),
      latitude: row.latitude,
      longitude: row.longitude,
      rating: typeof row.rating === 'number'
        && Number.isFinite(row.rating)
        && row.rating >= 0
        && row.rating <= 5
        ? row.rating
        : null,
      rating_count: Number.isInteger(row.rating_count) && row.rating_count >= 0
        ? row.rating_count
        : null,
      is_open_now: typeof row.is_open_now === 'boolean' ? row.is_open_now : null,
      photo_url: hero,
      category: toTaxonomy(row.category),
      subcategory: row.subcategory ? toTaxonomy(row.subcategory) : null,
      distance_km: visibility.distanceKm,
      zone: visibility.zone,
    },
  }
}

export { getDiscoveryZone } from '../lib/visibility'

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
    const mapped = sortedMappedPois(
      await findDiscoveryRows(route, { select: discoveryPoiListSelect }),
      route,
    )
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
    const mapped = sortedMappedPois(
      await findDiscoveryRows(route, { select: discoveryPoiListSelect }),
      route,
    )
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
    const rows: DiscoveryPoiDetailRow[] = await findDiscoveryRows(route, {
      select: discoveryPoiDetailSelect,
      take: 1,
    })
    const mapped = sortedMappedPois(rows, route)[0]
    if (!mapped) return null

    const { photo_url: heroPhotoUrl, ...detailCard } = mapped.card
    const hours = toPublicHours(rows[0]?.hours ?? null)

    return {
      ...detailCard,
      is_open_now: computeIsOpenNow(hours) ?? detailCard.is_open_now,
      description: mapped.row.description!.trim(),
      phone: mapped.row.phone?.trim() || null,
      website: sanitizeWebsite(mapped.row.website),
      hours,
      photos: mapped.photos,
      hero_photo_url: heroPhotoUrl,
      city: toCitySummary(mapped.row),
    }
  },
)
