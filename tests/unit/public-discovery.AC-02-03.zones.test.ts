const mockPoiFindMany = jest.fn()

jest.mock('server-only', () => ({}), { virtual: true })

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    pointOfInterest: { findMany: (...args: unknown[]) => mockPoiFindMany(...args) },
  },
}))

import {
  getDiscoveryCategory,
  getDiscoveryZone,
} from '@/features/public-discovery/queries/public-discovery'

function eligibleRow(id: string, longitude: number) {
  return {
    id,
    name: id,
    slug: id,
    description: 'Description',
    address: 'Adresse',
    latitude: 0,
    longitude,
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
    expect(getDiscoveryZone(15)).toBe('primary')
    expect(getDiscoveryZone(15 + Number.EPSILON * 16)).toBe('nearby')
    expect(getDiscoveryZone(30)).toBe('nearby')
    expect(getDiscoveryZone(30 + Number.EPSILON * 32)).toBeNull()
  })

  it('classifies fixed known coordinates with the shared Haversine implementation', async () => {
    mockPoiFindMany.mockResolvedValue([
      eligibleRow('primary-fixed', 0.1),
      eligibleRow('nearby-fixed', 0.2),
      eligibleRow('excluded-fixed', 0.4),
    ])

    const category = await getDiscoveryCategory('ville', 'categorie')

    expect(category?.pois.map(poi => [poi.slug, poi.zone])).toEqual([
      ['primary-fixed', 'primary'],
      ['nearby-fixed', 'nearby'],
    ])
  })

  it('excludes non-finite POI and city metrics safely', async () => {
    mockPoiFindMany.mockResolvedValue([
      { ...eligibleRow('nan-poi', 0.01), latitude: Number.NaN },
      { ...eligibleRow('infinite-poi', 0.01), longitude: Number.POSITIVE_INFINITY },
      {
        ...eligibleRow('invalid-city', 0.01),
        city: { ...eligibleRow('x', 0.01).city, latitude: Number.NaN },
      },
      {
        ...eligibleRow('latitude-out-of-range', 0.01),
        latitude: 91,
        city: { ...eligibleRow('x', 0.01).city, latitude: 91 },
      },
      {
        ...eligibleRow('longitude-out-of-range', 0.01),
        longitude: 181,
        city: { ...eligibleRow('x', 0.01).city, longitude: 181 },
      },
    ])

    await expect(getDiscoveryCategory('ville', 'categorie')).resolves.toBeNull()
  })
})
