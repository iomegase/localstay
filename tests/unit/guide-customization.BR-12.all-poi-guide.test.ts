jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: { findFirst: jest.fn() },
    pointOfInterest: { findMany: jest.fn() },
  },
}))

const mockGetPublicCustomization = jest.fn()

jest.mock('@/features/guide-customization/queries/customization', () => ({
  getPublicCustomization: (...args: unknown[]) => mockGetPublicCustomization(...args),
}))

import { getAllPoiCards } from '@/features/categories/queries/all-poi-cards'
import { prisma } from '@/shared/lib/prisma'

const mockCity = { id: 'city-1', latitude: 45.89, longitude: 6.71 }

function makePoi(id: string, slug: string, latitude: number) {
  return {
    id,
    name: `POI ${id}`,
    slug,
    address: 'Test address',
    latitude,
    longitude: 6.71,
    rating: null,
    rating_count: 0,
    is_open_now: null,
    hours: null,
    photos: [],
    phone: null,
    website: null,
    description: null,
    geocode_status: 'pending',
    category: { slug: 'restaurants' },
    subcategory: null,
    trail_detail: null,
  }
}

describe('012 all-POI guide in lodging mode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(prisma.city.findFirst).mockResolvedValue(mockCity as never)
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue([
      makePoi('near', 'near', 45.89),
      makePoi('featured', 'featured', 46.1),
    ] as never)
    mockGetPublicCustomization.mockResolvedValue({
      welcome_message: null,
      category_order: [],
      featured_pois: [
        { poi_id: 'featured', sort_order: 0, category_slug: 'restaurants' },
      ],
    })
  })

  it('BR-12: keeps all city POIs visible on the guide home when lodging recommendations exist', async () => {
    const result = await getAllPoiCards('saint-gervais', { lodgingId: 'lodging-1' })

    expect(result).not.toBeNull()
    expect(result!.items.map(poi => poi.slug)).toEqual(['near', 'featured'])
    expect(result!.meta.total).toBe(2)
  })
})
