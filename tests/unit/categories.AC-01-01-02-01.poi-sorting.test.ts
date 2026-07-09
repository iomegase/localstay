/**
 * AC-01-01 — POI list sorted by distance ASC by default
 * AC-02-01 — POI list sorted by rating DESC when sort=rating
 */

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: { findFirst: jest.fn() },
    category: { findFirst: jest.fn() },
    subCategory: { findFirst: jest.fn() },
    lodging: { findFirst: jest.fn() },
    pointOfInterest: { findMany: jest.fn() },
  },
}))

import { getPoiCards } from '@/features/categories/queries/poi-cards'
import { prisma } from '@/shared/lib/prisma'

const mockCity = { id: 'city-1', latitude: 45.89, longitude: 6.71 }
const mockCategory = { id: 'cat-1' }

function makePoi(overrides: {
  id: string; slug: string; latitude: number; longitude: number;
  rating?: number | null; is_open_now?: boolean | null; geocode_status?: string
}) {
  return {
    id: overrides.id,
    name: `POI ${overrides.id}`,
    slug: overrides.slug,
    address: 'Test address',
    latitude: overrides.latitude,
    longitude: overrides.longitude,
    rating: overrides.rating ?? null,
    rating_count: 0,
    is_open_now: overrides.is_open_now ?? null,
    hours: null,
    photos: [],
    phone: null,
    website: null,
    description: null,
    geocode_status: overrides.geocode_status ?? 'pending',
    subcategory: null,
    trail_detail: null,
  }
}

describe('getPoiCards', () => {
  beforeEach(() => {
    jest.mocked(prisma.city.findFirst).mockResolvedValue(mockCity as never)
    jest.mocked(prisma.category.findFirst).mockResolvedValue(mockCategory as never)
    jest.mocked(prisma.lodging.findFirst).mockResolvedValue(null)
  })

  afterEach(() => jest.clearAllMocks())

  it('returns null when city not found', async () => {
    jest.mocked(prisma.city.findFirst).mockResolvedValue(null)
    const result = await getPoiCards('unknown', 'restaurants')
    expect(result).toBeNull()
  })

  it('returns null when category not found', async () => {
    jest.mocked(prisma.category.findFirst).mockResolvedValue(null)
    const result = await getPoiCards('saint-gervais', 'unknown')
    expect(result).toBeNull()
  })

  it('AC-01-01: sorts by distance ASC by default (far POI first in DB → near POI first in result)', async () => {
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue([
      makePoi({ id: '1', slug: 'far', latitude: 46.5, longitude: 6.71 }),
      makePoi({ id: '2', slug: 'near', latitude: 45.89, longitude: 6.71 }),
    ] as never)

    const result = await getPoiCards('saint-gervais', 'restaurants')
    expect(result).not.toBeNull()
    // Both POIs lack geocode_status='success' → both in primary, sorted by distance ASC
    expect(result!.primary[0].slug).toBe('near')
    expect(result!.primary[1].slug).toBe('far')
    expect(result!.primary[0].distance_km).toBeLessThan(result!.primary[1].distance_km)
  })

  it('AC-02-01: sorts by rating DESC when sort=rating', async () => {
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue([
      makePoi({ id: '1', slug: 'low-rated', latitude: 45.89, longitude: 6.71, rating: 3.0 }),
      makePoi({ id: '2', slug: 'high-rated', latitude: 45.89, longitude: 6.71, rating: 4.8 }),
    ] as never)

    const result = await getPoiCards('saint-gervais', 'restaurants', { sort: 'rating' })
    expect(result).not.toBeNull()
    // Both POIs at same coords (distance ~0km) → in primary, sorted by rating DESC
    expect(result!.primary[0].slug).toBe('high-rated')
    expect(result!.primary[1].slug).toBe('low-rated')
  })

  it('maps photo_url to first photo in array', async () => {
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue([
      { ...makePoi({ id: '1', slug: 'p', latitude: 45.89, longitude: 6.71 }), photos: ['https://example.com/photo.jpg'] },
    ] as never)

    const result = await getPoiCards('saint-gervais', 'restaurants')
    expect(result!.primary[0].photo_url).toBe('https://example.com/photo.jpg')
  })

  it('maps photo_url to the first usable public photo when stored photos start with logos or placeholders', async () => {
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue([
      {
        ...makePoi({ id: '1', slug: 'p', latitude: 45.89, longitude: 6.71 }),
        photos: [
          'https://location-ski-saint-nicolas-de-veroce.fr/images/header-logo-light.png',
          'https://location-ski-saint-nicolas-de-veroce.fr/img/aucune-image.jpg',
          'https://location-ski-saint-nicolas-de-veroce.fr/upload/Mont-Blanc-ete.jpg',
        ],
      },
    ] as never)

    const result = await getPoiCards('saint-gervais', 'restaurants')
    expect(result!.primary[0].photo_url).toBe(
      'https://location-ski-saint-nicolas-de-veroce.fr/upload/Mont-Blanc-ete.jpg',
    )
  })

  it('maps photo_url to null when photos array is empty', async () => {
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue([
      makePoi({ id: '1', slug: 'p', latitude: 45.89, longitude: 6.71 }),
    ] as never)

    const result = await getPoiCards('saint-gervais', 'restaurants')
    expect(result!.primary[0].photo_url).toBeNull()
  })

  it('paginates primary and nearby zones independently with limit capped by options', async () => {
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue([
      makePoi({ id: 'p1', slug: 'primary-1', latitude: 45.89, longitude: 6.71, geocode_status: 'success' }),
      makePoi({ id: 'p2', slug: 'primary-2', latitude: 45.90, longitude: 6.71, geocode_status: 'success' }),
      makePoi({ id: 'n1', slug: 'nearby-1', latitude: 46.05, longitude: 6.71, geocode_status: 'success' }),
      makePoi({ id: 'n2', slug: 'nearby-2', latitude: 46.10, longitude: 6.71, geocode_status: 'success' }),
    ] as never)

    const result = await getPoiCards('saint-gervais', 'restaurants', { page: 2, limit: 1 })

    expect(result).not.toBeNull()
    expect(result!.primary.map(p => p.slug)).toEqual(['primary-2'])
    expect(result!.nearby.map(p => p.slug)).toEqual(['nearby-2'])
    expect(result!.meta).toMatchObject({
      total: 4,
      page: 2,
      limit: 1,
      total_pages: 2,
      primary_total: 2,
      nearby_total: 2,
      primary_total_pages: 2,
      nearby_total_pages: 2,
    })
  })

  it('BR-17: uses lodging coordinates for displayed distance without changing city-based zones', async () => {
    jest.mocked(prisma.lodging.findFirst).mockResolvedValue({
      id: 'lodging-1',
      customization: {
        lodging_latitude: 46.05,
        lodging_longitude: 6.71,
      },
    } as never)
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue([
      makePoi({ id: 'n1', slug: 'nearby-from-city', latitude: 46.05, longitude: 6.71, geocode_status: 'success' }),
    ] as never)

    const result = await getPoiCards('saint-gervais', 'restaurants', { lodgingId: 'lodging-1' })

    expect(result).not.toBeNull()
    expect(result!.primary).toHaveLength(0)
    expect(result!.nearby).toHaveLength(1)
    expect(result!.nearby[0].slug).toBe('nearby-from-city')
    expect(result!.nearby[0].distance_km).toBeCloseTo(0, 5)
    expect(result!.nearby[0].distance_source).toBe('lodging')
  })
})
