import { prisma } from '@/shared/lib/prisma'
import type { PoiDetail, PoiHours, HikingDetailData } from '../types'

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

export async function getPoiDetail(
  citySlug: string,
  categorySlug: string,
  poiSlug: string,
): Promise<PoiDetail | null> {
  const city = await prisma.city.findFirst({
    where: { slug: citySlug, is_active: true, deleted_at: null },
    select: { id: true, latitude: true, longitude: true },
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
    is_open_now: row.is_open_now,
    hours: row.hours as PoiHours | null,
    photos: row.photos,
    distance_km: haversineKm(city.latitude, city.longitude, row.latitude, row.longitude),
    category: row.category,
    subcategory: row.subcategory,
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
