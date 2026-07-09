jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: { findFirst: jest.fn() },
    lodging: { findFirst: jest.fn() },
    pointOfInterest: { findFirst: jest.fn() },
  },
}))

import { getPoiDetail } from '@/features/categories/queries/poi-detail'
import { prisma } from '@/shared/lib/prisma'

const mockCity = { id: 'city-1', latitude: 45.8921, longitude: 6.7085 }

const mockRow = {
  id: 'poi-1', name: 'Le Bistrot', slug: 'restaurants-gastro-demo',
  description: null, address: '1 rue Test',
  latitude: 45.8921, longitude: 6.7085,
  phone: null, website: null,
  rating: 4.5, rating_count: 120,
  is_open_now: true, hours: null, photos: [],
  category: { id: 'c1', name: 'Restaurants', slug: 'restaurants', icon: 'utensils' },
  subcategory: null, hiking_detail: null,
}

describe('getPoiDetail', () => {
  beforeEach(() => {
    jest.mocked(prisma.lodging.findFirst).mockResolvedValue(null)
  })

  afterEach(() => jest.clearAllMocks())

  it('returns null when city not found', async () => {
    jest.mocked(prisma.city.findFirst).mockResolvedValue(null)
    const result = await getPoiDetail('unknown', 'restaurants', 'slug')
    expect(result).toBeNull()
  })

  it('returns null when POI not found', async () => {
    jest.mocked(prisma.city.findFirst).mockResolvedValue(mockCity as any)
    jest.mocked(prisma.pointOfInterest.findFirst).mockResolvedValue(null)
    const result = await getPoiDetail('saint-gervais-les-bains', 'restaurants', 'unknown')
    expect(result).toBeNull()
  })

  it('returns PoiDetail with distance_km computed', async () => {
    jest.mocked(prisma.city.findFirst).mockResolvedValue(mockCity as any)
    jest.mocked(prisma.pointOfInterest.findFirst).mockResolvedValue(mockRow as any)

    const result = await getPoiDetail('saint-gervais-les-bains', 'restaurants', 'restaurants-gastro-demo')
    expect(result).not.toBeNull()
    expect(result!.name).toBe('Le Bistrot')
    expect(result!.distance_km).toBeCloseTo(0, 1)
    expect(result!.hiking_detail).toBeNull()
  })

  it('uses lodging coordinates as the displayed distance source when a lodging context is active', async () => {
    jest.mocked(prisma.city.findFirst).mockResolvedValue(mockCity as any)
    jest.mocked(prisma.lodging.findFirst).mockResolvedValue({
      customization: {
        lodging_latitude: 46.05,
        lodging_longitude: 6.71,
      },
    } as any)
    jest.mocked(prisma.pointOfInterest.findFirst).mockResolvedValue({
      ...mockRow,
      latitude: 46.05,
      longitude: 6.71,
    } as any)

    const result = await getPoiDetail(
      'saint-gervais-les-bains',
      'restaurants',
      'restaurants-gastro-demo',
      'lodging-1',
    )

    expect(result).not.toBeNull()
    expect(result!.distance_km).toBeCloseTo(0, 5)
    expect(result!.distance_source).toBe('lodging')
  })

  it('maps hiking_detail fields when present', async () => {
    const rowWithHiking = {
      ...mockRow,
      hiking_detail: {
        difficulty: 'hard',
        duration_minutes: 270,
        distance_km: 11.0,
        elevation_gain_m: 650,
        starting_point: 'Parking',
        parking_info: null,
        kids_friendly: false,
        pets_friendly: true,
        best_season: ['summer'],
        gpx_url: null,
      },
    }
    jest.mocked(prisma.city.findFirst).mockResolvedValue(mockCity as any)
    jest.mocked(prisma.pointOfInterest.findFirst).mockResolvedValue(rowWithHiking as any)

    const result = await getPoiDetail('saint-gervais-les-bains', 'randonnees', 'randonnees-demo')
    expect(result!.hiking_detail).not.toBeNull()
    expect(result!.hiking_detail!.difficulty).toBe('hard')
    expect(result!.hiking_detail!.elevation_gain_m).toBe(650)
  })
})
