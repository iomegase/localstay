const mockGroupBy = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    pointOfInterest: { groupBy: (...args: unknown[]) => mockGroupBy(...args) },
  },
}))

import { buildAdminPoiWhere } from '@/features/admin-pois/lib/admin-poi-rules'
import { adminPoiTaxonomyFilterHref } from '@/features/admin-pois/lib/list-filters'
import { getAdminPoiTaxonomyCounts } from '@/features/admin-pois/queries/admin-pois'

// Spec 069 — menu catégories / sous-catégories.
const taxonomy = [
  {
    id: 'cat-diner', name: 'Dîner', slug: 'diner',
    subcategories: [{ id: 'sub-resto', name: 'Restaurants', slug: 'restaurants' }],
  },
  {
    id: 'cat-shop', name: 'Shopping', slug: 'shopping',
    subcategories: [
      { id: 'sub-bout', name: 'Boutiques locales', slug: 'boutiques-locales' },
      { id: 'sub-souv', name: 'Souvenirs', slug: 'souvenirs' },
      { id: 'sub-ski', name: 'Location de ski', slug: 'location-de-ski' },
    ],
  },
  { id: 'cat-cult', name: 'Culture', slug: 'culture', subcategories: [] },
]

describe('069 BR-03 / AC-02-03 — filtre « sans sous-catégorie »', () => {
  it('subcategory_id=none filtre les POI sans sous-catégorie', () => {
    expect(buildAdminPoiWhere({ city_id: 'c', subcategory_id: 'none' })).toMatchObject({ subcategory_id: null })
  })

  it('une sous-catégorie précise garde le comportement actuel', () => {
    expect(buildAdminPoiWhere({ city_id: 'c', subcategory_id: 'sub-ski' })).toMatchObject({ subcategory_id: 'sub-ski' })
  })
})

describe('069 AC-01-02 — nombres de POI par catégorie et sous-catégorie', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGroupBy.mockResolvedValue([
      { category_id: 'cat-shop', subcategory_id: 'sub-bout', _count: { _all: 8 } },
      { category_id: 'cat-shop', subcategory_id: 'sub-ski', _count: { _all: 3 } },
      { category_id: 'cat-shop', subcategory_id: null, _count: { _all: 2 } },
      { category_id: 'cat-diner', subcategory_id: 'sub-resto', _count: { _all: 9 } },
    ])
  })

  it('ignore catégorie, sous-catégorie et pagination dans le comptage, garde les autres filtres', async () => {
    await getAdminPoiTaxonomyCounts({
      city_id: 'city-sg', q: 'ski', category_id: 'cat-shop', subcategory_id: 'sub-ski',
      status: 'active', discovery_status: 'PUBLISHED', page: 3, limit: 25,
    }, taxonomy)

    const where = mockGroupBy.mock.calls[0]![0].where
    expect(where).toMatchObject({ city_id: 'city-sg', is_active: true, discovery_status: 'PUBLISHED' })
    expect(where).not.toHaveProperty('category_id')
    expect(where).not.toHaveProperty('subcategory_id')
    expect(mockGroupBy.mock.calls[0]![0].by).toEqual(['category_id', 'subcategory_id'])
  })

  it('suit l’ordre de la taxonomie et masque catégories et sous-catégories vides', async () => {
    const counts = await getAdminPoiTaxonomyCounts({ city_id: 'city-sg', page: 1, limit: 25 }, taxonomy)

    expect(counts.total).toBe(22)
    expect(counts.categories).toEqual([
      {
        id: 'cat-diner', name: 'Dîner', count: 9, uncategorized_count: 0,
        subcategories: [{ id: 'sub-resto', name: 'Restaurants', count: 9 }],
      },
      {
        id: 'cat-shop', name: 'Shopping', count: 13, uncategorized_count: 2,
        subcategories: [
          { id: 'sub-bout', name: 'Boutiques locales', count: 8 },
          { id: 'sub-ski', name: 'Location de ski', count: 3 },
        ],
      },
    ])
  })

  it('garde visible la catégorie sélectionnée même vide', async () => {
    const counts = await getAdminPoiTaxonomyCounts({ city_id: 'city-sg', category_id: 'cat-cult', page: 1, limit: 25 }, taxonomy)

    expect(counts.categories.map(category => category.id)).toContain('cat-cult')
  })
})

describe('069 AC-01-03 / AC-02-02 — liens des pastilles', () => {
  const params = {
    city_id: 'city-sg', q: 'ski', category_id: 'cat-shop', subcategory_id: 'sub-bout',
    status: 'current', page: '3',
  }

  it('choisir une catégorie : page 1, sous-catégorie retirée, autres filtres conservés', () => {
    expect(adminPoiTaxonomyFilterHref(params, { category_id: 'cat-diner' })).toBe(
      '/admin/pois?city_id=city-sg&q=ski&category_id=cat-diner&status=current',
    )
  })

  it('« Toutes » retire catégorie et sous-catégorie', () => {
    expect(adminPoiTaxonomyFilterHref(params, { category_id: null })).toBe(
      '/admin/pois?city_id=city-sg&q=ski&status=current',
    )
  })

  it('choisir une sous-catégorie garde la catégorie, page 1', () => {
    expect(adminPoiTaxonomyFilterHref(params, { category_id: 'cat-shop', subcategory_id: 'none' })).toBe(
      '/admin/pois?city_id=city-sg&q=ski&category_id=cat-shop&subcategory_id=none&status=current',
    )
  })
})
