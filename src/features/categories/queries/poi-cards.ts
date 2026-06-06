import { prisma } from '@/shared/lib/prisma'
import type { PoiCard, PoiCardGroups, PoiHours } from '../types'
import { computeIsOpenNow, getTodayCloseLabel, getNextOpenLabel } from '../lib/is-open-now'
import { selectPrimaryPoiPhoto } from '../lib/photo-url'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50
const PRIMARY_RADIUS_KM = 15
const NEARBY_RADIUS_KM = 30

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function getPoiCards(
  citySlug: string,
  categorySlug: string,
  options: {
    subcategorySlug?: string
    sort?: 'distance' | 'rating'
    page?: number
    limit?: number
    lodgingId?: string
  } = {},
): Promise<PoiCardGroups | null> {
  const { subcategorySlug, sort = 'distance' } = options
  const page = Math.max(1, Math.floor(options.page ?? DEFAULT_PAGE))
  const limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(options.limit ?? DEFAULT_LIMIT)))
  const start = (page - 1) * limit
  const end = start + limit

  const emptyGroups = (): PoiCardGroups => ({
    primary: [],
    nearby: [],
    meta: {
      total: 0,
      page,
      limit,
      total_pages: 0,
      primary_total: 0,
      nearby_total: 0,
      primary_total_pages: 0,
      nearby_total_pages: 0,
    },
  })

  const city = await prisma.city.findFirst({
    where: { slug: citySlug, is_active: true, deleted_at: null },
    select: { id: true, latitude: true, longitude: true },
  })
  if (!city) return null

  const category = await prisma.category.findFirst({
    where: { slug: categorySlug, is_active: true, deleted_at: null },
    select: { id: true },
  })
  if (!category) return null

  let subcategoryId: string | undefined
  if (subcategorySlug) {
    const sub = await prisma.subCategory.findFirst({
      where: {
        slug: subcategorySlug,
        category_id: category.id,
        is_active: true,
        deleted_at: null,
      },
      select: { id: true },
    })
    if (!sub) return emptyGroups()
    subcategoryId = sub.id
  }

  const rows = await prisma.pointOfInterest.findMany({
    where: {
      city_id: city.id,
      category_id: category.id,
      ...(subcategoryId ? { subcategory_id: subcategoryId } : {}),
      is_active: true,
      deleted_at: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      address: true,
      latitude: true,
      longitude: true,
      rating: true,
      rating_count: true,
      is_open_now: true,
      hours: true,
      photos: true,
      phone: true,
      website: true,
      description: true,
      geocode_status: true,
      subcategory: { select: { name: true } },
      trail_detail: {
        select: {
          is_active: true,
          deleted_at: true,
          difficulty: true,
          estimated_duration_min: true,
          distance_km: true,
          elevation_gain_m: true,
        },
      },
    },
  })

  type RawRow = {
    id: string; name: string; slug: string; address: string
    latitude: number; longitude: number; rating: number | null
    rating_count: number; is_open_now: boolean | null
    hours: unknown
    photos: string[]
    phone: string | null
    website: string | null
    description: string | null
    geocode_status: string
    subcategory: { name: string } | null
    trail_detail: {
      is_active: boolean
      deleted_at: Date | null
      difficulty: string
      estimated_duration_min: number | null
      distance_km: number | null
      elevation_gain_m: number | null
    } | null
  }

  const cards: PoiCard[] = (rows as RawRow[])
    .map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    address: p.address,
    subcategory_name: p.subcategory?.name ?? null,
    rating: p.rating,
    rating_count: p.rating_count,
    is_open_now: computeIsOpenNow(p.hours as PoiHours | null) ?? p.is_open_now,
    distance_km: haversineKm(city.latitude, city.longitude, p.latitude, p.longitude),
    photo_url: selectPrimaryPoiPhoto(p.photos),
    photos: p.photos,
    phone: p.phone,
    website: p.website,
    description: p.description,
    closes_at_label: getTodayCloseLabel(p.hours as PoiHours | null),
    next_open_label: getNextOpenLabel(p.hours as PoiHours | null),
    latitude: p.latitude,
    longitude: p.longitude,
    trail_detail: p.trail_detail && p.trail_detail.is_active && !p.trail_detail.deleted_at
      ? {
          difficulty: p.trail_detail.difficulty as NonNullable<PoiCard['trail_detail']>['difficulty'],
          estimated_duration_min: p.trail_detail.estimated_duration_min,
          distance_km: p.trail_detail.distance_km,
          elevation_gain_m: p.trail_detail.elevation_gain_m,
        }
      : null,
  }))

  // Split: nearby = géocodés avec succès ET distance > 15km
  // POI pending/failed gardent les coords placeholder → distance_km ≈ 0 → restent dans primary
  const geocodedSlugs = new Set(
    (rows as RawRow[])
      .filter(r => r.geocode_status === 'success')
      .map(r => r.slug)
  )

  const primary: PoiCard[] = []
  const nearby: PoiCard[] = []

  for (const card of cards) {
    if (geocodedSlugs.has(card.slug) && card.distance_km > NEARBY_RADIUS_KM) {
      continue
    }

    if (geocodedSlugs.has(card.slug) && card.distance_km > PRIMARY_RADIUS_KM) {
      nearby.push(card)
    } else {
      primary.push(card)
    }
  }

  const sortFn = sort === 'rating'
    ? (a: PoiCard, b: PoiCard) => (b.rating ?? 0) - (a.rating ?? 0)
    : (a: PoiCard, b: PoiCard) => a.distance_km - b.distance_km

  const sortedPrimary = primary.sort(sortFn)
  const sortedNearby = nearby.sort(sortFn)
  const primaryTotalPages = Math.ceil(sortedPrimary.length / limit)
  const nearbyTotalPages = Math.ceil(sortedNearby.length / limit)

  return {
    primary: sortedPrimary.slice(start, end),
    nearby: sortedNearby.slice(start, end),
    meta: {
      total: sortedPrimary.length + sortedNearby.length,
      page,
      limit,
      total_pages: Math.max(primaryTotalPages, nearbyTotalPages),
      primary_total: sortedPrimary.length,
      nearby_total: sortedNearby.length,
      primary_total_pages: primaryTotalPages,
      nearby_total_pages: nearbyTotalPages,
    },
  }
}
