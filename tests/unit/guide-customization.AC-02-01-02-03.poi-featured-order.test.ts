/**
 * AC-02-01 — Les favoris Owner restent consultables via la page dédiée
 * AC-02-03 — Sans lodging param, le guide reste standard
 * BR-12 — Avec lodging, le guide public de la ville ne se réduit pas aux favoris
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
    photos: [],
    geocode_status: 'pending',
    subcategory: null,
  }
}

describe('012 guide customization POI ordering', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(prisma.city.findFirst).mockResolvedValue(mockCity as never)
    jest.mocked(prisma.category.findFirst).mockResolvedValue(mockCategory as never)
    jest.mocked(prisma.lodging.findFirst).mockResolvedValue(null)
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue([
      makePoi('near', 'near', 45.89),
      makePoi('featured', 'featured', 46.1),
    ] as never)
  })

  it('AC-02-03: keeps standard distance order when lodging is absent', async () => {
    const result = await getPoiCards('saint-gervais', 'restaurants')

    expect(result).not.toBeNull()
    expect(result!.primary.map(poi => poi.slug)).toEqual(['near', 'featured'])
  })

  it('BR-12: keeps the full category guide in lodging mode', async () => {
    const result = await getPoiCards('saint-gervais', 'restaurants', { lodgingId: 'lodging-1' })

    expect(result).not.toBeNull()
    expect(result!.primary.map(poi => poi.slug)).toEqual(['near', 'featured'])
    expect(result!.meta.total).toBe(2)
  })
})
