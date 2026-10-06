const mockPoiFindMany = jest.fn()

jest.mock('server-only', () => ({}), { virtual: true })

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    pointOfInterest: { findMany: (...args: unknown[]) => mockPoiFindMany(...args) },
    poiPhotoMirror: { findMany: async () => [] },
  },
}))

import {
  getDiscoveryCategory,
  getDiscoveryCity,
  getDiscoveryPoi,
} from '@/features/public-discovery/queries/public-discovery'

// Spec 065 — DTO /decouvrir organisés par la taxonomie, POI sans photo.
const LONG_DESCRIPTION = 'Loueur de skis et de snowboards au pied des pistes, conseils personnalisés et entretien du matériel. '.repeat(2).trim()

type Sub = { id: string; name: string; slug: string; sort_order: number }
type Cat = { id: string; name: string; slug: string; icon: string; sort_order: number }

const SHOPPING: Cat = { id: 'cat-shop', name: 'Shopping', slug: 'shopping', icon: 'shopping-bag', sort_order: 4 }
const DINER: Cat = { id: 'cat-diner', name: 'Dîner', slug: 'diner', icon: 'utensils', sort_order: 0 }
const URGENCES: Cat = { id: 'cat-urg', name: 'Urgences', slug: 'urgences', icon: 'cross', sort_order: 9 }
const SKI: Sub = { id: 'sub-ski', name: 'Location de ski', slug: 'location-de-ski', sort_order: 3 }
const BOUTIQUES: Sub = { id: 'sub-bout', name: 'Boutiques locales', slug: 'boutiques-locales', sort_order: 0 }
const PRODUITS: Sub = { id: 'sub-prod', name: 'Produits régionaux', slug: 'produits-regionaux', sort_order: 2 }
const RESTAURANTS: Sub = { id: 'sub-resto', name: 'Restaurants', slug: 'restaurants', sort_order: 0 }

function row(slug: string, options: {
  category: Cat
  subcategory?: Sub | null
  photos?: string[]
  longitude?: number
}) {
  const subcategory = options.subcategory ?? null
  return {
    id: slug,
    name: slug,
    slug,
    description: LONG_DESCRIPTION,
    address: 'Adresse',
    latitude: 0,
    longitude: options.longitude ?? 0.001,
    phone: '+33450000000',
    website: 'https://example.com',
    rating: null,
    rating_count: 0,
    is_open_now: null,
    hours: null,
    photos: options.photos ?? [`https://example.com/${slug}.jpg`],
    discovery_status: 'PUBLISHED',
    discovery_published_at: new Date('2026-10-01T00:00:00.000Z'),
    is_active: true,
    deleted_at: null,
    geocode_status: 'success',
    subcategory_id: subcategory?.id ?? null,
    city: {
      id: 'city-1', name: 'Saint-Gervais', slug: 'saint-gervais', postal_code: '74170',
      department: null, region: null, latitude: 0, longitude: 0, is_active: true, deleted_at: null,
    },
    category: { ...options.category, is_active: true, deleted_at: null },
    subcategory: subcategory
      ? { ...subcategory, category_id: options.category.id, is_active: true, deleted_at: null }
      : null,
  }
}

describe('065 — requêtes publiques /decouvrir', () => {
  beforeEach(() => jest.clearAllMocks())

  it('AC-01-01 / AC-01-02 : catégories dans l’ordre taxonomie avec icône et sous-catégories comptées', async () => {
    mockPoiFindMany.mockResolvedValueOnce([
      row('blanc-sport', { category: SHOPPING, subcategory: SKI }),
      row('epicerie', { category: SHOPPING, subcategory: PRODUITS }),
      row('boutique-a', { category: SHOPPING, subcategory: BOUTIQUES }),
      row('boutique-b', { category: SHOPPING, subcategory: BOUTIQUES }),
      row('sans-sous', { category: SHOPPING }),
      row('le-terrier', { category: DINER, subcategory: RESTAURANTS }),
    ])

    const city = await getDiscoveryCity('saint-gervais')

    expect(city?.categories.map(category => [category.slug, category.icon])).toEqual([
      ['diner', 'utensils'],
      ['shopping', 'shopping-bag'],
    ])
    expect(city?.categories[1]!.subcategories).toEqual([
      { name: 'Boutiques locales', slug: 'boutiques-locales', poi_count: 2 },
      { name: 'Produits régionaux', slug: 'produits-regionaux', poi_count: 1 },
      { name: 'Location de ski', slug: 'location-de-ski', poi_count: 1 },
    ])
  })

  it('AC-02-01 / AC-02-03 / AC-02-05 : groupes de la zone principale, « Aux alentours » à part', async () => {
    mockPoiFindMany.mockResolvedValueOnce([
      row('blanc-sport', { category: SHOPPING, subcategory: SKI, longitude: 0.01 }),
      row('boutique-loin', { category: SHOPPING, subcategory: BOUTIQUES, longitude: 0.05 }),
      row('boutique-pres', { category: SHOPPING, subcategory: BOUTIQUES, longitude: 0.001 }),
      row('sans-sous', { category: SHOPPING }),
      row('alentours', { category: SHOPPING, subcategory: SKI, longitude: 0.2 }), // ~22 km
    ])

    const category = await getDiscoveryCategory('saint-gervais', 'shopping')

    expect(category?.groups.map(group => [
      group.subcategory?.slug ?? null,
      group.pois.map(poi => poi.slug),
    ])).toEqual([
      ['boutiques-locales', ['boutique-pres', 'boutique-loin']],
      ['location-de-ski', ['blanc-sport']],
      [null, ['sans-sous']],
    ])
    expect(category?.groups[0]!.subcategory).toEqual({ name: 'Boutiques locales', slug: 'boutiques-locales' })
    expect(category?.nearby_pois.map(poi => poi.slug)).toEqual(['alentours'])
  })

  it('AC-03-03 : un POI sans photo est publié avec l’image de son type de lieu', async () => {
    mockPoiFindMany.mockResolvedValueOnce([
      row('blanc-sport', { category: SHOPPING, subcategory: SKI, photos: [] }),
    ])

    const category = await getDiscoveryCategory('saint-gervais', 'shopping')
    const card = category?.groups[0]!.pois[0]

    expect(card).toMatchObject({
      slug: 'blanc-sport',
      photo_url: '/fallback/fallback-location-de-ski.png',
      photo_is_fallback: true,
    })
  })

  it('AC-03-03 : la fiche sans photo n’a ni galerie ni crédit', async () => {
    mockPoiFindMany.mockResolvedValueOnce([
      row('blanc-sport', { category: SHOPPING, subcategory: SKI, photos: [] }),
    ])

    const poi = await getDiscoveryPoi('saint-gervais', 'shopping', 'blanc-sport')

    expect(poi).toMatchObject({
      photos: [],
      hero_photo_url: '/fallback/fallback-location-de-ski.png',
      photo_is_fallback: true,
      photo_credit: null,
    })
  })

  it('BR-08 : la catégorie urgences n’a pas de page publique', async () => {
    mockPoiFindMany.mockResolvedValueOnce([
      row('pharmacie', { category: URGENCES }),
    ])

    await expect(getDiscoveryCategory('saint-gervais', 'urgences')).resolves.toBeNull()
  })
})
