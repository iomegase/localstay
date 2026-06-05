import { prisma } from '@/shared/lib/prisma'
import type { PoiCard, PoiHours } from '../types'
import { computeIsOpenNow, getTodayCloseLabel } from '../lib/is-open-now'

const NEARBY_RADIUS_KM = 30
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

/** Carte POI de la vue « Tous » : porte sa propre catégorie (liste multi-catégories). */
export interface AllPoisCard extends PoiCard {
  category_slug: string
}

export interface AllPoisResult {
  items: AllPoisCard[]
  meta: { page: number; limit: number; total: number; total_pages: number }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Tous les POI actifs d'une ville (toutes catégories), triés et paginés pour le scroll
 * infini de la home (« Tous »). Liste plate : proches d'abord (tri distance) ou par note.
 * En mode logement, le guide reste complet et ne se réduit pas aux recommandations Owner.
 */
export async function getAllPoiCards(
  citySlug: string,
  options: { sort?: 'distance' | 'rating'; page?: number; limit?: number; lodgingId?: string | null } = {},
): Promise<AllPoisResult | null> {
  const sort = options.sort === 'rating' ? 'rating' : 'distance'
  const page = Math.max(1, Math.floor(options.page ?? 1))
  const limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(options.limit ?? DEFAULT_LIMIT)))

  const city = await prisma.city.findFirst({
    where: { slug: citySlug, is_active: true, deleted_at: null },
    select: { id: true, latitude: true, longitude: true },
  })
  if (!city) return null

  const rows = await prisma.pointOfInterest.findMany({
    where: {
      city_id: city.id,
      is_active: true,
      deleted_at: null,
      category: { is_active: true, deleted_at: null },
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
      category: { select: { slug: true } },
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

  type RawRow = (typeof rows)[number]

  const cards: AllPoisCard[] = rows
    .map((p: RawRow) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    category_slug: p.category.slug,
    address: p.address,
    subcategory_name: p.subcategory?.name ?? null,
    rating: p.rating,
    rating_count: p.rating_count,
    is_open_now: computeIsOpenNow(p.hours as PoiHours | null) ?? p.is_open_now,
    distance_km: haversineKm(city.latitude, city.longitude, p.latitude, p.longitude),
    photo_url: p.photos[0] ?? null,
    photos: p.photos,
    phone: p.phone,
    website: p.website,
    description: p.description,
    closes_at_label: getTodayCloseLabel(p.hours as PoiHours | null),
    latitude: p.latitude,
    longitude: p.longitude,
    trail_detail:
      p.trail_detail && p.trail_detail.is_active && !p.trail_detail.deleted_at
        ? {
            difficulty: p.trail_detail.difficulty as NonNullable<PoiCard['trail_detail']>['difficulty'],
            estimated_duration_min: p.trail_detail.estimated_duration_min,
            distance_km: p.trail_detail.distance_km,
            elevation_gain_m: p.trail_detail.elevation_gain_m,
          }
        : null,
    _geocoded: p.geocode_status === 'success',
  })) as Array<AllPoisCard & { _geocoded: boolean }>

  // Exclure les POI géocodés au-delà de 30 km (mais garder les pending/failed à distance ≈ 0).
  const visible = (cards as Array<AllPoisCard & { _geocoded: boolean }>)
    .filter(card => !(card._geocoded && card.distance_km > NEARBY_RADIUS_KM))
    .map(({ _geocoded: _ignored, ...card }) => card)

  const sorted = visible.sort((a, b) =>
    sort === 'rating' ? (b.rating ?? 0) - (a.rating ?? 0) : a.distance_km - b.distance_km,
  )

  const total = sorted.length
  const start = (page - 1) * limit
  return {
    items: sorted.slice(start, start + limit),
    meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
  }
}
