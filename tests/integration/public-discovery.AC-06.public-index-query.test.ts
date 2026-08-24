const mockPoiFindMany = jest.fn()

jest.mock('server-only', () => ({}), { virtual: true })

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    pointOfInterest: { findMany: (...args: unknown[]) => mockPoiFindMany(...args) },
  },
}))

import { getDiscoveryIndex } from '@/features/public-discovery/queries/public-discovery'

const publishedAt = new Date('2026-08-24T12:00:00.000Z')

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'poi-1',
    name: 'Le Musée Alpin',
    slug: 'le-musee-alpin',
    description: ' Une adresse locale documentée. ',
    address: ' 1 rue du Mont-Blanc ',
    latitude: 45.8921,
    longitude: 6.7185,
    phone: '+33 4 50 00 00 00',
    website: null,
    rating: 4.7,
    rating_count: 32,
    is_open_now: true,
    photos: ['https://example.com/musee-hero.jpg'],
    discovery_status: 'PUBLISHED',
    discovery_published_at: publishedAt,
    is_active: true,
    deleted_at: null,
    geocode_status: 'success',
    subcategory_id: null,
    city: {
      id: 'city-1',
      name: 'Annecy',
      slug: 'annecy',
      postal_code: '74000',
      department: 'Haute-Savoie',
      region: 'Auvergne-Rhône-Alpes',
      latitude: 45.8921,
      longitude: 6.7085,
      is_active: true,
      deleted_at: null,
    },
    category: {
      id: 'category-1',
      name: 'Culture',
      slug: 'culture',
      icon: 'landmark',
      sort_order: 2,
      is_active: true,
      deleted_at: null,
    },
    subcategory: null,
    lodging_id: 'lodging-secret',
    owner_note: 'secret',
    featured_by_lodgings: [{ lodging_id: 'lodging-secret' }],
    source_payload: { private: true },
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }
}

function withCity(
  city: { id: string; name: string; slug: string },
  poi: Record<string, unknown> = {},
) {
  return row({
    id: `poi-${city.id}`,
    slug: `poi-${city.slug}`,
    city: { ...row().city, ...city },
    ...poi,
  })
}

function expectExactIndexQuery(call: unknown) {
  const args = call as { where: Record<string, unknown>; select: Record<string, unknown>; take?: number }
  expect(Object.keys(args.where).sort()).toEqual([
    'OR', 'category', 'city', 'deleted_at', 'discovery_published_at', 'discovery_status',
    'geocode_status', 'is_active',
  ].sort())
  expect(args.where).toMatchObject({
    discovery_status: 'PUBLISHED',
    discovery_published_at: { not: null },
    is_active: true,
    deleted_at: null,
    geocode_status: 'success',
    city: { is_active: true, deleted_at: null },
    category: { is_active: true, deleted_at: null },
    OR: [
      { subcategory_id: null },
      { subcategory: { is: { is_active: true, deleted_at: null } } },
    ],
  })
  expect(args.where).not.toHaveProperty('city.slug')
  expect(args.take).toBeUndefined()

  expect(Object.keys(args.select).sort()).toEqual([
    'address', 'category', 'deleted_at', 'description', 'discovery_published_at',
    'discovery_status', 'geocode_status', 'id', 'is_active', 'is_open_now',
    'latitude', 'longitude', 'name', 'phone', 'photos', 'rating', 'rating_count',
    'slug', 'subcategory', 'subcategory_id', 'website', 'city',
  ].sort())
  expect(Object.keys((args.select.city as { select: object }).select).sort()).toEqual([
    'deleted_at', 'department', 'id', 'is_active', 'latitude', 'longitude',
    'name', 'postal_code', 'region', 'slug',
  ].sort())
  expect(Object.keys((args.select.category as { select: object }).select).sort()).toEqual([
    'deleted_at', 'icon', 'id', 'is_active', 'name', 'slug', 'sort_order',
  ].sort())
  expect(Object.keys((args.select.subcategory as { select: object }).select).sort()).toEqual([
    'category_id', 'deleted_at', 'id', 'is_active', 'name', 'slug', 'sort_order',
  ].sort())

  const serialized = JSON.stringify(args.select)
  for (const forbidden of [
    'lodging', 'owner_note', 'featured_by_lodgings', 'merchant_profile',
    'source_payload', 'google_place_id', 'created_at', 'updated_at',
  ]) {
    expect(serialized).not.toContain(forbidden)
  }
}

function expectExactPublicIndexDto(value: unknown) {
  const forbidden = new Set([
    'id', 'lodging_id', 'owner_note', 'featured_by_lodgings', 'recommendation',
    'deleted_at', 'is_active', 'discovery_status', 'discovery_published_at',
    'source_payload', 'created_at', 'updated_at', 'google_place_id', 'status',
    'audit', 'owner', 'lodging',
  ])
  const exact = (candidate: unknown, keys: string[]) => {
    expect(Object.keys(candidate as Record<string, unknown>).sort()).toEqual([...keys].sort())
  }
  const walk = (candidate: unknown): void => {
    if (Array.isArray(candidate)) {
      candidate.forEach(walk)
      return
    }
    if (!candidate || typeof candidate !== 'object') return
    for (const [key, nested] of Object.entries(candidate)) {
      expect(forbidden).not.toContain(key)
      walk(nested)
    }
  }

  expect(Array.isArray(value)).toBe(true)
  for (const city of value as unknown[]) {
    exact(city, ['department', 'name', 'pois', 'postal_code', 'region', 'slug'])
    for (const poi of (city as { pois: unknown[] }).pois) {
      exact(poi, [
        'address', 'category', 'distance_km', 'is_open_now', 'latitude', 'longitude',
        'name', 'photo_url', 'rating', 'rating_count', 'slug', 'subcategory', 'zone',
      ])
      exact((poi as { category: unknown }).category, ['name', 'slug'])
      const subcategory = (poi as { subcategory: unknown }).subcategory
      if (subcategory) exact(subcategory, ['name', 'slug'])
    }
  }
  walk(value)
}

describe('041 AC-06 public discovery index query', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('uses exactly one private-relation-free global POI query and returns French-name city order with slug tie-breakers', async () => {
    mockPoiFindMany.mockResolvedValue([
      withCity({ id: 'city-evian-z', name: 'Évian', slug: 'evian-z' }),
      withCity({ id: 'city-annecy', name: 'Annecy', slug: 'annecy' }),
      withCity({ id: 'city-evian-a', name: 'Evian', slug: 'evian-a' }),
    ])

    const index = await getDiscoveryIndex()

    expect(mockPoiFindMany).toHaveBeenCalledTimes(1)
    expectExactIndexQuery(mockPoiFindMany.mock.calls[0]?.[0])
    expect(index.map(city => `${city.name}:${city.slug}`)).toEqual([
      'Annecy:annecy', 'Evian:evian-a', 'Évian:evian-z',
    ])
    expectExactPublicIndexDto(index)
  })

  it('keeps only the first five eligible POIs per city after hub-specific zone, distance, French-name and slug ordering', async () => {
    mockPoiFindMany.mockResolvedValue([
      row({ id: 'bravo', slug: 'bravo', name: 'Bravo', longitude: 6.7135 }),
      row({ id: 'eclair-z', slug: 'eclair-z', name: 'Éclair', longitude: 6.7185 }),
      row({ id: 'eclair-a', slug: 'eclair-a', name: 'Eclair', longitude: 6.7185 }),
      row({ id: 'delta', slug: 'delta', name: 'Delta', longitude: 6.7385 }),
      row({ id: 'nearby-a', slug: 'nearby-a', name: 'Alpha alentours', longitude: 6.9185 }),
      row({ id: 'nearby-z', slug: 'nearby-z', name: 'Zulu alentours', longitude: 6.9285 }),
    ])

    const index = await getDiscoveryIndex()

    expect(index).toHaveLength(1)
    expect(index[0]?.pois.map(poi => poi.slug)).toEqual([
      'bravo', 'eclair-a', 'eclair-z', 'delta', 'nearby-a',
    ])
    expect(index[0]?.pois.map(poi => poi.zone)).toEqual([
      'primary', 'primary', 'primary', 'primary', 'nearby',
    ])
  })

  it('defensively omits every stale visibility variant and cities containing only invalid rows', async () => {
    const invalidCity = { id: 'city-invalid', name: 'Invalidville', slug: 'invalidville' }
    const stale = [
      row({ id: 'draft', discovery_status: 'DRAFT' }),
      row({ id: 'missing-publication-date', discovery_published_at: null }),
      row({ id: 'inactive', is_active: false }),
      row({ id: 'deleted', deleted_at: new Date() }),
      row({ id: 'description', description: ' ' }),
      row({ id: 'photo', photos: ['https://example.com/logo.svg'] }),
      row({ id: 'address', address: ' ' }),
      row({ id: 'geocode', geocode_status: 'failed' }),
      row({ id: 'poi-latitude', latitude: 91 }),
      row({ id: 'out-of-range', longitude: 7.2 }),
      row({ id: 'contact', phone: ' ', website: 'ftp://example.com' }),
      row({ id: 'city-inactive', city: { ...row().city, is_active: false } }),
      row({ id: 'city-deleted', city: { ...row().city, deleted_at: new Date() } }),
      row({ id: 'city-coordinate', city: { ...row().city, latitude: 91 } }),
      row({ id: 'city-slug', city: { ...row().city, slug: 'Invalid city' } }),
      row({ id: 'category-inactive', category: { ...row().category, is_active: false } }),
      row({ id: 'category-deleted', category: { ...row().category, deleted_at: new Date() } }),
      row({ id: 'category-slug', category: { ...row().category, slug: 'Invalid category' } }),
      row({ id: 'poi-slug', slug: 'Invalid poi' }),
      row({ id: 'subcategory-missing', subcategory_id: 'sub-1', subcategory: null }),
      row({
        id: 'subcategory-inactive', subcategory_id: 'sub-1',
        subcategory: { id: 'sub-1', category_id: 'category-1', name: 'Musées', slug: 'musees', sort_order: 1, is_active: false, deleted_at: null },
      }),
      row({
        id: 'subcategory-deleted', subcategory_id: 'sub-1',
        subcategory: { id: 'sub-1', category_id: 'category-1', name: 'Musées', slug: 'musees', sort_order: 1, is_active: true, deleted_at: new Date() },
      }),
      row({
        id: 'subcategory-mismatch', subcategory_id: 'sub-1',
        subcategory: { id: 'sub-1', category_id: 'other-category', name: 'Musées', slug: 'musees', sort_order: 1, is_active: true, deleted_at: null },
      }),
      withCity(invalidCity, { description: ' ' }),
    ]
    mockPoiFindMany.mockResolvedValue([row(), ...stale])

    const index = await getDiscoveryIndex()

    expect(index).toHaveLength(1)
    expect(index[0]?.slug).toBe('annecy')
    expect(index[0]?.pois).toHaveLength(1)
    expect(index[0]?.pois[0]?.slug).toBe('le-musee-alpin')
  })

  it('returns an empty index when no public POI survives defensive filtering', async () => {
    mockPoiFindMany.mockResolvedValue([])

    await expect(getDiscoveryIndex()).resolves.toEqual([])
    expect(mockPoiFindMany).toHaveBeenCalledTimes(1)
  })
})
