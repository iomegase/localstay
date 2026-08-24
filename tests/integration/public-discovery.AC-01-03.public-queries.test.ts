const mockPoiFindMany = jest.fn()

jest.mock('server-only', () => ({}), { virtual: true })

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    pointOfInterest: { findMany: (...args: unknown[]) => mockPoiFindMany(...args) },
  },
}))

import {
  getDiscoveryCategory,
  getDiscoveryCity,
  getDiscoveryPoi,
} from '@/features/public-discovery/queries/public-discovery'

const publishedAt = new Date('2026-08-20T12:00:00.000Z')

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'poi-1',
    name: 'Le Musée Alpin',
    slug: 'le-musee-alpin',
    description: ' Une adresse locale documentée. ',
    address: ' 1 rue du Mont-Blanc ',
    latitude: 45.8921,
    longitude: 6.7085,
    phone: '+33 4 50 00 00 00',
    website: null,
    rating: 4.7,
    rating_count: 32,
    is_open_now: true,
    hours: { mon: '09:00-18:00' },
    photos: [
      'https://example.com/logo.svg',
      'https://example.com/musee-hero.jpg',
      'https://example.com/musee-gallery.jpg',
    ],
    discovery_status: 'PUBLISHED',
    discovery_published_at: publishedAt,
    is_active: true,
    deleted_at: null,
    geocode_status: 'success',
    subcategory_id: null,
    city: {
      id: 'city-1',
      name: 'Saint-Gervais-les-Bains',
      slug: 'saint-gervais-les-bains',
      postal_code: '74170',
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

function expectStrictPublicQuery(call: unknown, expected: Record<string, string> = {}) {
  expect(call).toEqual(expect.objectContaining({
    where: expect.objectContaining({
      discovery_status: 'PUBLISHED',
      discovery_published_at: { not: null },
      is_active: true,
      deleted_at: null,
      geocode_status: 'success',
      city: expect.objectContaining({
        is_active: true,
        deleted_at: null,
        ...(expected.city ? { slug: expected.city } : {}),
      }),
      category: expect.objectContaining({
        is_active: true,
        deleted_at: null,
        ...(expected.category ? { slug: expected.category } : {}),
      }),
      OR: expect.arrayContaining([
        { subcategory_id: null },
        { subcategory: { is: { is_active: true, deleted_at: null } } },
      ]),
      ...(expected.poi ? { slug: expected.poi } : {}),
    }),
    select: expect.any(Object),
  }))

  const serializedSelect = JSON.stringify((call as { select: unknown }).select)
  for (const forbidden of [
    'lodging', 'owner_note', 'featured_by_lodgings', 'merchant_profile',
    'source_payload', 'google_place_id', 'created_at', 'updated_at',
  ]) {
    expect(serializedSelect).not.toContain(forbidden)
  }
}

function expectExactPrismaContract(call: unknown, detail: boolean) {
  const args = call as { where: Record<string, unknown>; select: Record<string, unknown>; take?: number }
  const whereKeys = [
    'OR', 'category', 'city', 'deleted_at', 'discovery_published_at',
    'discovery_status', 'geocode_status', 'is_active',
    ...(detail ? ['slug'] : []),
  ]
  const listSelectKeys = [
    'address', 'category', 'deleted_at', 'description', 'discovery_published_at',
    'discovery_status', 'geocode_status', 'id', 'is_active', 'is_open_now',
    'latitude', 'longitude', 'name', 'phone', 'photos', 'rating', 'rating_count',
    'slug', 'subcategory', 'subcategory_id', 'website', 'city',
  ]
  expect(Object.keys(args.where).sort()).toEqual(whereKeys.sort())
  expect(Object.keys(args.select).sort()).toEqual([
    ...listSelectKeys,
    ...(detail ? ['hours'] : []),
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
  expect(args.take).toBe(detail ? 1 : undefined)
}

function expectNoForbiddenFields(value: unknown) {
  const forbidden = new Set([
    'id', 'lodging_id', 'owner_note', 'featured_by_lodgings', 'recommendation',
    'deleted_at', 'is_active', 'discovery_status', 'discovery_published_at',
    'source_payload', 'created_at', 'updated_at', 'google_place_id',
  ])

  function walk(current: unknown): void {
    if (Array.isArray(current)) {
      current.forEach(walk)
      return
    }
    if (!current || typeof current !== 'object') return
    for (const [key, nested] of Object.entries(current)) {
      expect(forbidden).not.toContain(key)
      walk(nested)
    }
  }

  walk(value)
}

function expectExactPublicDto(value: unknown, kind: 'city' | 'category' | 'detail') {
  const object = value as Record<string, unknown>
  const cityKeys = ['categories', 'department', 'name', 'postal_code', 'region', 'slug']
  const citySummaryKeys = ['department', 'name', 'postal_code', 'region', 'slug']
  const taxonomyKeys = ['name', 'slug']
  const cardKeys = [
    'address', 'category', 'distance_km', 'is_open_now', 'latitude', 'longitude',
    'name', 'photo_url', 'rating', 'rating_count', 'slug', 'subcategory', 'zone',
  ]
  const categoryKeys = ['city', 'icon', 'name', 'pois', 'slug', 'sort_order', 'subcategories']
  const detailKeys = [
    'address', 'category', 'city', 'description', 'distance_km', 'hero_photo_url',
    'hours', 'is_open_now', 'latitude', 'longitude', 'name', 'phone', 'photos',
    'rating', 'rating_count', 'slug', 'subcategory', 'website', 'zone',
  ]
  const exact = (candidate: unknown, keys: string[]) => {
    expect(candidate).not.toBeNull()
    expect(Object.keys(candidate as Record<string, unknown>).sort()).toEqual([...keys].sort())
  }
  const exactTaxonomy = (candidate: unknown) => exact(candidate, taxonomyKeys)
  const exactCard = (candidate: unknown) => {
    exact(candidate, cardKeys)
    const card = candidate as Record<string, unknown>
    exactTaxonomy(card.category)
    if (card.subcategory) exactTaxonomy(card.subcategory)
  }

  if (kind === 'city') {
    exact(object, cityKeys)
    for (const category of object.categories as Array<Record<string, unknown>>) {
      exact(category, ['icon', 'name', 'poi_count', 'pois', 'slug', 'sort_order'])
      for (const poi of category.pois as unknown[]) exactCard(poi)
    }
  } else if (kind === 'category') {
    exact(object, categoryKeys)
    exact(object.city, citySummaryKeys)
    for (const subcategory of object.subcategories as unknown[]) exactTaxonomy(subcategory)
    for (const poi of object.pois as unknown[]) exactCard(poi)
  } else {
    exact(object, detailKeys)
    exact(object.city, citySummaryKeys)
    exactTaxonomy(object.category)
    if (object.subcategory) exactTaxonomy(object.subcategory)
  }
}

describe('041 AC-01-03 public discovery Prisma read model', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPoiFindMany.mockResolvedValue([row()])
  })

  it('applies the complete publication constraints and a private-relation-free select on every route query', async () => {
    await getDiscoveryCity(' saint-gervais-les-bains ')
    await getDiscoveryCategory('SAINT-GERVAIS-LES-BAINS', 'culture')
    await getDiscoveryPoi('saint-gervais-les-bains', 'culture', 'le-musee-alpin')

    expect(mockPoiFindMany).toHaveBeenCalledTimes(3)
    expectStrictPublicQuery(mockPoiFindMany.mock.calls[0]?.[0], {
      city: 'saint-gervais-les-bains',
    })
    expectStrictPublicQuery(mockPoiFindMany.mock.calls[1]?.[0], {
      city: 'saint-gervais-les-bains', category: 'culture',
    })
    expectStrictPublicQuery(mockPoiFindMany.mock.calls[2]?.[0], {
      city: 'saint-gervais-les-bains', category: 'culture', poi: 'le-musee-alpin',
    })
    expect(mockPoiFindMany.mock.calls[0]?.[0]).not.toHaveProperty('select.hours')
    expect(mockPoiFindMany.mock.calls[1]?.[0]).not.toHaveProperty('select.hours')
    expect(mockPoiFindMany.mock.calls[2]?.[0]).toMatchObject({
      select: { hours: true },
      take: 1,
    })
    expectExactPrismaContract(mockPoiFindMany.mock.calls[0]?.[0], false)
    expectExactPrismaContract(mockPoiFindMany.mock.calls[1]?.[0], false)
    expectExactPrismaContract(mockPoiFindMany.mock.calls[2]?.[0], true)
  })

  it('defensively excludes every stale BR-04 variant, allows no subcategory, filters photos and returns only public DTO fields', async () => {
    const stale = [
      row({ id: 'draft', discovery_status: 'DRAFT' }),
      row({ id: 'unpublished-date', discovery_published_at: null }),
      row({ id: 'inactive', is_active: false }),
      row({ id: 'deleted', deleted_at: new Date() }),
      row({ id: 'description', description: ' ' }),
      row({ id: 'photo', photos: ['https://example.com/logo.svg'] }),
      row({ id: 'address', address: ' ' }),
      row({ id: 'geocode', geocode_status: 'failed' }),
      row({ id: 'contact', phone: ' ', website: 'ftp://example.com' }),
      row({ id: 'city', city: { ...row().city, is_active: false } }),
      row({ id: 'category', category: { ...row().category, deleted_at: new Date() } }),
      row({
        id: 'subcategory',
        subcategory_id: 'sub-1',
        subcategory: {
          id: 'sub-1', category_id: 'category-1', name: 'Musées', slug: 'musees', sort_order: 1,
          is_active: false, deleted_at: null,
        },
      }),
    ]
    mockPoiFindMany.mockResolvedValue([row(), ...stale])

    const city = await getDiscoveryCity('saint-gervais-les-bains')

    expect(city?.categories).toHaveLength(1)
    expect(city?.categories[0]?.pois).toHaveLength(1)
    expect(city?.categories[0]?.pois[0]).toMatchObject({
      slug: 'le-musee-alpin',
      photo_url: 'https://example.com/musee-hero.jpg',
      zone: 'primary',
      subcategory: null,
    })
    expectNoForbiddenFields(city)
    expectExactPublicDto(city, 'city')
  })

  it('orders non-empty categories by sort order then French name and POIs by zone, distance then French name', async () => {
    const restaurant = {
      id: 'category-2', name: 'Épiceries', slug: 'epiceries', icon: 'store',
      sort_order: 1, is_active: true, deleted_at: null,
    }
    const bakery = { ...restaurant, id: 'category-3', name: 'Boulangeries', slug: 'boulangeries' }
    mockPoiFindMany.mockResolvedValue([
      row({ id: 'near', name: 'À proximité lointaine', longitude: 6.95 }),
      row({ id: 'culture-z', name: 'Zoo alpin', longitude: 6.72 }),
      row({ id: 'culture-a', name: 'Écomusée', longitude: 6.72 }),
      row({ id: 'bakery', name: 'Pain local', category: bakery }),
      row({ id: 'shop', name: 'Produits locaux', category: restaurant }),
    ])

    const city = await getDiscoveryCity('saint-gervais-les-bains')

    expect(city?.categories.map(category => category.name)).toEqual([
      'Boulangeries', 'Épiceries', 'Culture',
    ])
    expect(city?.categories[2]?.pois.map(poi => poi.name)).toEqual([
      'Écomusée', 'Zoo alpin', 'À proximité lointaine',
    ])
  })

  it('returns null for invalid or empty routes and for a category with no eligible in-range POI', async () => {
    expect(await getDiscoveryCity('')).toBeNull()
    expect(await getDiscoveryCategory('bad/slug', 'culture')).toBeNull()
    expect(await getDiscoveryPoi('city', 'category', 'é')).toBeNull()
    expect(mockPoiFindMany).not.toHaveBeenCalled()

    mockPoiFindMany.mockResolvedValue([])
    expect(await getDiscoveryCity('saint-gervais-les-bains')).toBeNull()
    expect(await getDiscoveryCategory('saint-gervais-les-bains', 'culture')).toBeNull()
    expect(await getDiscoveryPoi('saint-gervais-les-bains', 'culture', 'missing')).toBeNull()
  })

  it('requires the exact city/category/POI relationship and exposes only valid contact variants', async () => {
    mockPoiFindMany.mockResolvedValue([
      row({
        slug: 'different-poi',
        city: { ...row().city, slug: 'other-city' },
        category: { ...row().category, slug: 'other-category' },
      }),
    ])
    expect(await getDiscoveryPoi('saint-gervais-les-bains', 'culture', 'le-musee-alpin')).toBeNull()

    mockPoiFindMany.mockResolvedValue([row({
      subcategory_id: 'sub-1',
      subcategory: {
        id: 'sub-1', category_id: 'different-category', name: 'Musées', slug: 'musees',
        sort_order: 1, is_active: true, deleted_at: null,
      },
    })])
    expect(await getDiscoveryPoi('saint-gervais-les-bains', 'culture', 'le-musee-alpin')).toBeNull()

    mockPoiFindMany.mockResolvedValue([row({
      subcategory_id: 'sub-1',
      subcategory: {
        id: 'sub-1', category_id: 'category-1', name: 'Musées', slug: 'musees',
        sort_order: 1, is_active: true, deleted_at: null,
      },
    })])
    await expect(
      getDiscoveryPoi('saint-gervais-les-bains', 'culture', 'le-musee-alpin'),
    ).resolves.toMatchObject({ subcategory: { slug: 'musees' } })

    mockPoiFindMany.mockResolvedValue([row({ phone: ' +33 4 50 00 00 00 ', website: 'javascript:alert(1)' })])
    const phoneOnly = await getDiscoveryPoi('saint-gervais-les-bains', 'culture', 'le-musee-alpin')
    expect(phoneOnly).toMatchObject({ phone: '+33 4 50 00 00 00', website: null })

    mockPoiFindMany.mockResolvedValue([row({ phone: null, website: ' https://musee.example/ ' })])
    const websiteOnly = await getDiscoveryPoi('saint-gervais-les-bains', 'culture', 'le-musee-alpin')
    expect(websiteOnly).toMatchObject({ phone: null, website: 'https://musee.example/' })
    expect(websiteOnly?.photos).toEqual([
      'https://example.com/musee-hero.jpg',
      'https://example.com/musee-gallery.jpg',
    ])
    expect(websiteOnly?.hero_photo_url).toBe('https://example.com/musee-hero.jpg')
    expect(websiteOnly).not.toHaveProperty('photo_url')
    expectNoForbiddenFields(websiteOnly)
    expectExactPublicDto(websiteOnly, 'detail')
  })

  it('parses hours through a strict day/time/key allowlist and derives open state only from accepted hours', async () => {
    mockPoiFindMany.mockResolvedValue([row({
      is_open_now: true,
      hours: {
        '0': { open: '08:00', close: '12:00', owner_note: 'secret' },
        '1': { open: '09:00', close: '18:30' },
        '2': null,
        '3': { open: '25:00', close: '18:00' },
        '4': { open: '9:00', close: '17:00' },
        '5': { open: '09:60', close: '17:00' },
        '6': { open: '24:00', close: '24:00' },
        '7': { open: '09:00', close: '17:00' },
        private: { nested: { lodging_id: 'secret' } },
      },
    })])

    const detail = await getDiscoveryPoi('saint-gervais-les-bains', 'culture', 'le-musee-alpin')

    expect(detail?.hours).toEqual({
      '1': { open: '09:00', close: '18:30' },
      '2': null,
    })
    expect(Object.keys(detail?.hours ?? {})).toEqual(['1', '2'])
    expect(Object.keys(detail?.hours?.['1'] ?? {}).sort()).toEqual(['close', 'open'])
    expect(JSON.stringify(detail)).not.toContain('owner_note')
    expect(JSON.stringify(detail)).not.toContain('lodging_id')
    expectExactPublicDto(detail, 'detail')

    mockPoiFindMany.mockResolvedValue([row({
      is_open_now: false,
      hours: Object.fromEntries(
        Array.from({ length: 7 }, (_, day) => [String(day), { open: '00:00', close: '24:00' }]),
      ),
    })])
    const alwaysOpen = await getDiscoveryPoi(
      'saint-gervais-les-bains',
      'culture',
      'le-musee-alpin',
    )
    expect(alwaysOpen?.is_open_now).toBe(true)

    mockPoiFindMany.mockResolvedValue([row({
      is_open_now: false,
      hours: { private: { open: '00:00', close: '24:00' } },
    })])
    const noSchedule = await getDiscoveryPoi(
      'saint-gervais-les-bains',
      'culture',
      'le-musee-alpin',
    )
    expect(noSchedule).toMatchObject({ hours: null, is_open_now: false })
  })

  it('canonicalizes and deduplicates usable photos and nulls corrupt optional rating facts', async () => {
    mockPoiFindMany.mockResolvedValue([row({
      rating: 5.1,
      rating_count: -2,
      photos: [
        'https://EXAMPLE.com:443/photo.jpg',
        'https://example.com/photo.jpg',
        ' https://example.com/gallery.jpg ',
        'https://example.com/logo.svg',
      ],
    })])

    const detail = await getDiscoveryPoi('saint-gervais-les-bains', 'culture', 'le-musee-alpin')

    expect(detail).toMatchObject({
      hero_photo_url: 'https://example.com/photo.jpg',
      photos: ['https://example.com/photo.jpg', 'https://example.com/gallery.jpg'],
      rating: null,
      rating_count: null,
    })
    expectExactPublicDto(detail, 'detail')
  })

  it('preserves eligible HTTP, unlisted HTTPS and configured-host photos for native public rendering', async () => {
    mockPoiFindMany.mockResolvedValue([row({
      photos: [
        'http://media.unlisted.test/http-photo.jpg',
        'https://media.unlisted.test/https-photo.jpg',
        'https://images.unsplash.com/configured-photo.jpg',
      ],
    })])

    const detail = await getDiscoveryPoi('saint-gervais-les-bains', 'culture', 'le-musee-alpin')

    expect(detail?.photos).toEqual([
      'http://media.unlisted.test/http-photo.jpg',
      'https://media.unlisted.test/https-photo.jpg',
      'https://images.unsplash.com/configured-photo.jpg',
    ])
    expect(detail?.hero_photo_url).toBe('http://media.unlisted.test/http-photo.jpg')
  })

  it('returns the exact category DTO allowlist including only active represented subcategories', async () => {
    mockPoiFindMany.mockResolvedValue([row({
      subcategory_id: 'sub-1',
      subcategory: {
        id: 'sub-1', category_id: 'category-1', name: 'Musées', slug: 'musees',
        sort_order: 1, is_active: true, deleted_at: null,
      },
    })])

    const category = await getDiscoveryCategory('saint-gervais-les-bains', 'culture')

    expectExactPublicDto(category, 'category')
  })
})
