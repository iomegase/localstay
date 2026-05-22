import { prisma } from '@/shared/lib/prisma'
import type { PoiCard } from '../types'

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
  options: { subcategorySlug?: string; sort?: 'distance' | 'rating' } = {},
): Promise<PoiCard[] | null> {
  const { subcategorySlug, sort = 'distance' } = options

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
    if (!sub) return []
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
    take: 50,
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
      photos: true,
      subcategory: { select: { name: true } },
    },
  })

  type RawRow = {
    id: string; name: string; slug: string; address: string
    latitude: number; longitude: number; rating: number | null
    rating_count: number; is_open_now: boolean | null; photos: string[]
    subcategory: { name: string } | null
  }

  const cards: PoiCard[] = (rows as RawRow[]).map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    address: p.address,
    subcategory_name: p.subcategory?.name ?? null,
    rating: p.rating,
    rating_count: p.rating_count,
    is_open_now: p.is_open_now,
    distance_km: haversineKm(city.latitude, city.longitude, p.latitude, p.longitude),
    photo_url: p.photos[0] ?? null,
  }))

  if (sort === 'rating') {
    return cards.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  }
  return cards.sort((a, b) => a.distance_km - b.distance_km)
}
