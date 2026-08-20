const mockPoiFindMany = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    pointOfInterest: { findMany: (...args: unknown[]) => mockPoiFindMany(...args) },
  },
}))

import { getDiscoveryCategory } from '@/features/public-discovery/queries/public-discovery'

const EARTH_RADIUS_KM = 6371

function longitudeAtDistance(distanceKm: number): number {
  return distanceKm / EARTH_RADIUS_KM * 180 / Math.PI
}

function eligibleRow(id: string, distanceKm: number) {
  return {
    id,
    name: id,
    slug: id,
    description: 'Description',
    address: 'Adresse',
    latitude: 0,
    longitude: longitudeAtDistance(distanceKm),
    phone: '+33450000000',
    website: null,
    rating: null,
    rating_count: 0,
    is_open_now: null,
    hours: null,
    photos: [`https://example.com/${id}.jpg`],
    discovery_status: 'PUBLISHED',
    discovery_published_at: new Date('2026-08-20T12:00:00.000Z'),
    is_active: true,
    deleted_at: null,
    geocode_status: 'success',
    subcategory_id: null,
    city: {
      id: 'city-1', name: 'Ville', slug: 'ville', postal_code: '74000',
      department: null, region: null, latitude: 0, longitude: 0,
      is_active: true, deleted_at: null,
    },
    category: {
      id: 'category-1', name: 'Catégorie', slug: 'categorie', icon: 'map-pin',
      sort_order: 0, is_active: true, deleted_at: null,
    },
    subcategory: null,
  }
}

describe('041 AC-02-03 global discovery zones', () => {
  beforeEach(() => jest.clearAllMocks())

  it('keeps 15 km primary, puts just above 15 through 30 km nearby, and excludes just above 30 km', async () => {
    mockPoiFindMany.mockResolvedValue([
      eligibleRow('at-15', 15),
      eligibleRow('above-15', 15.0001),
      eligibleRow('at-30', 30),
      eligibleRow('above-30', 30.0001),
    ])

    const category = await getDiscoveryCategory('ville', 'categorie')

    expect(category?.pois.map(poi => [poi.slug, poi.zone])).toEqual([
      ['at-15', 'primary'],
      ['above-15', 'nearby'],
      ['at-30', 'nearby'],
    ])
  })

  it('excludes non-finite POI and city metrics safely', async () => {
    mockPoiFindMany.mockResolvedValue([
      { ...eligibleRow('nan-poi', 1), latitude: Number.NaN },
      { ...eligibleRow('infinite-poi', 1), longitude: Number.POSITIVE_INFINITY },
      {
        ...eligibleRow('invalid-city', 1),
        city: { ...eligibleRow('x', 1).city, latitude: Number.NaN },
      },
      {
        ...eligibleRow('latitude-out-of-range', 1),
        latitude: 91,
        city: { ...eligibleRow('x', 1).city, latitude: 91 },
      },
      {
        ...eligibleRow('longitude-out-of-range', 1),
        longitude: 181,
        city: { ...eligibleRow('x', 1).city, longitude: 181 },
      },
    ])

    await expect(getDiscoveryCategory('ville', 'categorie')).resolves.toBeNull()
  })
})
