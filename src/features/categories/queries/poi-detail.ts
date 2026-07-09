import { cache } from 'react'
import { prisma } from '@/shared/lib/prisma'
import type { PoiDetail, PoiHours, HikingDetailData, TrailDetailData } from '../types'
import { computeIsOpenNow } from '../lib/is-open-now'
import { getLodgingDistanceOrigin } from './lodging-distance-origin'

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

// Mémoïsé par requête (React cache) : generateMetadata + la page partagent le même fetch.
export const getPoiDetail = cache(getPoiDetailUncached)

async function getPoiDetailUncached(
  citySlug: string,
  categorySlug: string,
  poiSlug: string,
  lodgingId?: string | null,
): Promise<PoiDetail | null> {
  const city = await prisma.city.findFirst({
    where: { slug: citySlug, is_active: true, deleted_at: null },
    select: { id: true, name: true, slug: true, region: true, postal_code: true, latitude: true, longitude: true },
  })
  if (!city) return null

  const row = await prisma.pointOfInterest.findFirst({
    where: {
      city_id: city.id,
      slug: poiSlug,
      is_active: true,
      deleted_at: null,
      category: { slug: categorySlug },
    },
    select: {
      id: true, name: true, slug: true, description: true,
      address: true, latitude: true, longitude: true,
      phone: true, website: true, rating: true, rating_count: true,
      is_open_now: true, hours: true, photos: true,
      category: { select: { id: true, name: true, slug: true, icon: true } },
      subcategory: { select: { id: true, name: true, slug: true } },
      hiking_detail: {
        select: {
          difficulty: true, duration_minutes: true, distance_km: true,
          elevation_gain_m: true, starting_point: true, parking_info: true,
          kids_friendly: true, pets_friendly: true, best_season: true, gpx_url: true,
        },
      },
      trail_detail: {
        select: {
          is_active: true,
          deleted_at: true,
          difficulty: true,
          estimated_duration_min: true,
          distance_km: true,
          elevation_gain_m: true,
          start_label: true,
          start_latitude: true,
          start_longitude: true,
          geometry_geojson: true,
          parking_info: true,
          kids_friendly: true,
          pets_friendly: true,
          best_season: true,
          gpx_url: true,
          data_quality_status: true,
          primary_source_type: true,
          source_refs: true,
        },
      },
      merchant_offers: {
        where: {
          deleted_at: null,
          is_active: true,
          ends_at: { gt: new Date() },
        },
        select: { id: true, title: true, description: true, ends_at: true, is_active: true },
        orderBy: { created_at: 'desc' },
      },
    },
  })
  if (!row) return null

  const hiking: HikingDetailData | null = row.hiking_detail
    ? {
        difficulty: row.hiking_detail.difficulty as HikingDetailData['difficulty'],
        duration_minutes: row.hiking_detail.duration_minutes,
        distance_km: row.hiking_detail.distance_km,
        elevation_gain_m: row.hiking_detail.elevation_gain_m,
        starting_point: row.hiking_detail.starting_point,
        parking_info: row.hiking_detail.parking_info,
        kids_friendly: row.hiking_detail.kids_friendly,
        pets_friendly: row.hiking_detail.pets_friendly,
        best_season: row.hiking_detail.best_season,
        gpx_url: row.hiking_detail.gpx_url,
      }
    : null

  const trail: TrailDetailData | null = row.trail_detail && row.trail_detail.is_active && !row.trail_detail.deleted_at
    ? {
        difficulty: row.trail_detail.difficulty as TrailDetailData['difficulty'],
        estimated_duration_min: row.trail_detail.estimated_duration_min,
        distance_km: row.trail_detail.distance_km,
        elevation_gain_m: row.trail_detail.elevation_gain_m,
        start_label: row.trail_detail.start_label,
        start_latitude: row.trail_detail.start_latitude,
        start_longitude: row.trail_detail.start_longitude,
        geometry_geojson: row.trail_detail.geometry_geojson,
        parking_info: row.trail_detail.parking_info,
        kids_friendly: row.trail_detail.kids_friendly,
        pets_friendly: row.trail_detail.pets_friendly,
        best_season: row.trail_detail.best_season,
        gpx_url: row.trail_detail.gpx_url,
        data_quality_status: row.trail_detail.data_quality_status as TrailDetailData['data_quality_status'],
        primary_source_type: row.trail_detail.primary_source_type,
        source_refs: toTrailSourceRefs(row.trail_detail.source_refs),
      }
    : null
  const lodgingOrigin = await getLodgingDistanceOrigin(city.id, lodgingId)
  const cityDistanceKm = haversineKm(city.latitude, city.longitude, row.latitude, row.longitude)
  const displayDistanceKm = lodgingOrigin
    ? haversineKm(lodgingOrigin.latitude, lodgingOrigin.longitude, row.latitude, row.longitude)
    : cityDistanceKm

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    website: row.website,
    rating: row.rating,
    rating_count: row.rating_count,
    is_open_now: computeIsOpenNow(row.hours as PoiHours | null) ?? row.is_open_now,
    hours: row.hours as PoiHours | null,
    photos: row.photos,
    distance_km: displayDistanceKm,
    distance_source: lodgingOrigin ? 'lodging' : 'city_center',
    city: { name: city.name, slug: city.slug, region: city.region, postal_code: city.postal_code },
    category: row.category,
    subcategory: row.subcategory,
    trail_detail: trail,
    hiking_detail: hiking,
    merchant_offers: (row.merchant_offers ?? []).map(offer => ({
      id: offer.id,
      title: offer.title,
      description: offer.description,
      ends_at: offer.ends_at.toISOString(),
      status: 'active',
    })),
  }
}

function toTrailSourceRefs(value: unknown): TrailDetailData['source_refs'] {
  if (!Array.isArray(value)) return []
  return value.flatMap(item => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) return []
    const record = item as Record<string, unknown>
    if (typeof record.type !== 'string' || typeof record.attribution !== 'string' || !Array.isArray(record.used_for)) {
      return []
    }
    return [{
      type: record.type,
      name: typeof record.name === 'string' ? record.name : null,
      url: typeof record.url === 'string' ? record.url : null,
      attribution: record.attribution,
      used_for: record.used_for.filter((use): use is string => typeof use === 'string'),
    }]
  })
}
