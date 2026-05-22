/**
 * AC-01-01 — POI list sorted by distance ASC by default
 * AC-02-01 — POI list sorted by rating DESC when sort=rating
 */

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: { findFirst: jest.fn() },
    category: { findFirst: jest.fn() },
    subCategory: { findFirst: jest.fn() },
    pointOfInterest: { findMany: jest.fn() },
  },
}))

import { getPoiCards } from '@/features/categories/queries/poi-cards'
import { prisma } from '@/shared/lib/prisma'

const mockCity = { id: 'city-1', latitude: 45.89, longitude: 6.71 }
const mockCategory = { id: 'cat-1' }

function makePoi(overrides: {
  id: string; slug: string; latitude: number; longitude: number;
  rating?: number | null; is_open_now?: boolean | null
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
    photos: [],
    subcategory: null,
  }
}

describe('getPoiCards', () => {
  beforeEach(() => {
    jest.mocked(prisma.city.findFirst).mockResolvedValue(mockCity as never)
    jest.mocked(prisma.category.findFirst).mockResolvedValue(mockCategory as never)
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
    expect(result![0].slug).toBe('near')
    expect(result![1].slug).toBe('far')
    expect(result![0].distance_km).toBeLessThan(result![1].distance_km)
  })

  it('AC-02-01: sorts by rating DESC when sort=rating', async () => {
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue([
      makePoi({ id: '1', slug: 'low-rated', latitude: 45.89, longitude: 6.71, rating: 3.0 }),
      makePoi({ id: '2', slug: 'high-rated', latitude: 45.89, longitude: 6.71, rating: 4.8 }),
    ] as never)

    const result = await getPoiCards('saint-gervais', 'restaurants', { sort: 'rating' })
    expect(result).not.toBeNull()
    expect(result![0].slug).toBe('high-rated')
    expect(result![1].slug).toBe('low-rated')
  })

  it('maps photo_url to first photo in array', async () => {
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue([
      { ...makePoi({ id: '1', slug: 'p', latitude: 45.89, longitude: 6.71 }), photos: ['https://example.com/photo.jpg'] },
    ] as never)

    const result = await getPoiCards('saint-gervais', 'restaurants')
    expect(result![0].photo_url).toBe('https://example.com/photo.jpg')
  })

  it('maps photo_url to null when photos array is empty', async () => {
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue([
      makePoi({ id: '1', slug: 'p', latitude: 45.89, longitude: 6.71 }),
    ] as never)

    const result = await getPoiCards('saint-gervais', 'restaurants')
    expect(result![0].photo_url).toBeNull()
  })
})
