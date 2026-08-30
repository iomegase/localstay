import {
  discoveryPoiSchema,
  discoveryItemListSchema,
  localBusinessSchema,
  touristAttractionSchema,
} from '@/features/seo/lib/structured-data'
import type { DiscoveryPoiDetail } from '@/features/public-discovery/types'

const BASE = 'https://mystay.example.com'
const discoveryPath = '/decouvrir/saint-gervais-les-bains/culture/le-musee-alpin'

const poiInput = {
  name: 'Le Musée Alpin',
  description: 'Un musée consacré à l’histoire locale.',
  address: '1 rue du Mont-Blanc',
  latitude: 45.8921,
  longitude: 6.7085,
  phone: '+33450000000',
  website: 'https://musee.example.com',
  rating: 4.7,
  ratingCount: 32,
  hours: null,
  photos: ['https://images.example.com/musee.jpg'],
  cityName: 'Saint-Gervais-les-Bains',
  cityRegion: 'Auvergne-Rhône-Alpes',
  postalCode: '74170',
  path: discoveryPath,
}

const discoveryPoi: DiscoveryPoiDetail = {
  name: 'Le Musée Alpin',
  slug: 'le-musee-alpin',
  description: 'Un musée consacré à l’histoire locale.',
  address: '1 rue du Mont-Blanc',
  latitude: 45.8921,
  longitude: 6.7085,
  phone: '+33450000000',
  website: 'https://musee.example.com',
  rating: 4.7,
  rating_count: 32,
  is_open_now: true,
  hours: null,
  photos: [
    'https://images.example.com/musee.jpg',
    'https://images.example.com/musee-cachee.jpg',
  ],
  hero_photo_url: 'https://images.example.com/musee.jpg',
  category: { name: 'Culture', slug: 'culture' },
  subcategory: { name: 'Musées', slug: 'musees' },
  distance_km: 0.4,
  zone: 'primary',
  city: {
    name: 'Saint-Gervais-les-Bains',
    slug: 'saint-gervais-les-bains',
    postal_code: '74170',
    department: 'Haute-Savoie',
    region: 'Auvergne-Rhône-Alpes',
  },
}

describe('041 AC-01-05 / AC-03-04 discovery structured data', () => {
  const realBase = process.env.NEXT_PUBLIC_BASE_URL

  beforeAll(() => {
    process.env.NEXT_PUBLIC_BASE_URL = BASE
  })

  afterAll(() => {
    if (realBase === undefined) delete process.env.NEXT_PUBLIC_BASE_URL
    else process.env.NEXT_PUBLIC_BASE_URL = realBase
  })

  it('creates an ItemList containing only the visible /decouvrir items supplied by the page', () => {
    const schema = discoveryItemListSchema({
      name: 'Culture à Saint-Gervais-les-Bains',
      items: [
        { name: 'Le Musée Alpin', path: discoveryPath },
        {
          name: 'Maison forte de Hautetour',
          path: '/decouvrir/saint-gervais-les-bains/culture/maison-forte-hautetour',
        },
      ],
    })

    expect(schema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Culture à Saint-Gervais-les-Bains',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Le Musée Alpin',
          url: `${BASE}${discoveryPath}`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Maison forte de Hautetour',
          url: `${BASE}/decouvrir/saint-gervais-les-bains/culture/maison-forte-hautetour`,
        },
      ],
    })
    expect(JSON.stringify(schema)).not.toContain('/guide/')
  })

  it.each([
    '/guide/saint-gervais-les-bains/culture/le-musee-alpin',
    'https://evil.example/decouvrir/ville/categorie/poi',
    '//evil.example/decouvrir/ville/categorie/poi',
    '/decouvrir/ville/categorie\\poi',
    '/decouvrir/ville/categorie/poi?next=/admin',
    '/decouvrir/ville/categorie/poi#fragment',
    '/decouvrir/ville/categorie/poi%2Fadmin',
    '/decouvrir/ville/categorie/%2e%2e',
    '/decouvrir/ville/../poi',
    '/decouvrir/ville/./poi',
    '/decouvrir/ville//poi',
    '/decouvrir/ville/categorie/poi/',
    '/decouvrir/Ville/categorie/poi',
    '/decouvrir/ville/categorie/poi_slug',
    '/decouvrir',
  ])('omits unsafe or non-canonical discovery path %s', path => {
    const schema = discoveryItemListSchema({
      name: 'Sélection locale',
      items: [{ name: 'Contenu non canonique', path }],
    })

    expect(schema.itemListElement).toEqual([])
    expect(JSON.stringify(schema)).not.toContain(path)
  })

  it('keeps contiguous positions after omitting an invalid item', () => {
    const schema = discoveryItemListSchema({
      name: 'Sélection locale',
      items: [
        { name: 'URL externe', path: 'https://evil.example/poi' },
        { name: 'Le Musée Alpin', path: discoveryPath },
      ],
    })

    expect(schema.itemListElement).toEqual([{
      '@type': 'ListItem',
      position: 1,
      name: 'Le Musée Alpin',
      url: `${BASE}${discoveryPath}`,
    }])
  })

  it('uses the caller-provided /decouvrir path for every supported POI schema', () => {
    expect(localBusinessSchema(poiInput).url).toBe(`${BASE}${discoveryPath}`)
    expect(touristAttractionSchema(poiInput).url).toBe(`${BASE}${discoveryPath}`)
  })

  it.each([
    ['restaurant', 'Restaurant'],
    ['boulangerie', 'Bakery'],
    ['bar', 'BarOrPub'],
    ['HÔTEL', 'Hotel'],
    ['magasin', 'Store'],
    ['spa', 'DaySpa'],
    ['musée', 'Museum'],
    ['activité touristique', 'TouristAttraction'],
    ['inconnu', 'LocalBusiness'],
  ] as const)('maps the canonical subcategory slug %s to %s', (subcategorySlug, expectedType) => {
    const schema = discoveryPoiSchema({
      ...discoveryPoi,
      category: { name: 'Sélection', slug: 'selection' },
      subcategory: { name: subcategorySlug, slug: subcategorySlug },
    })

    expect(schema['@type']).toBe(expectedType)
  })

  it('normalizes canonical slug accents, case, spaces and underscores deterministically', () => {
    const schema = discoveryPoiSchema({
      ...discoveryPoi,
      category: { name: 'Sélection', slug: 'selection' },
      subcategory: { name: 'Activité touristique', slug: '  ACTIVITÉ_TOURISTIQUE  ' },
    })

    expect(schema['@type']).toBe('TouristAttraction')
  })

  it.each([
    {
      category: { name: 'Activité touristique', slug: 'activite-touristique' },
      subcategory: { name: 'Restaurant', slug: 'restaurant' },
    },
    {
      category: { name: 'Restaurant', slug: 'restaurant' },
      subcategory: { name: 'Activité touristique', slug: 'activite-touristique' },
    },
  ])('lets a specific type win over a broad tourist taxonomy: %j', taxonomy => {
    const schema = discoveryPoiSchema({ ...discoveryPoi, ...taxonomy })

    expect(schema['@type']).toBe('Restaurant')
  })

  it('uses the category only when the subcategory mapping is unknown', () => {
    const schema = discoveryPoiSchema({
      ...discoveryPoi,
      category: { name: 'Boulangerie', slug: 'boulangerie' },
      subcategory: { name: 'Artisan', slug: 'artisan' },
    })

    expect(schema['@type']).toBe('Bakery')
  })

  it('falls back to LocalBusiness for two conflicting specific taxonomy types', () => {
    const schema = discoveryPoiSchema({
      ...discoveryPoi,
      category: { name: 'Restaurant', slug: 'restaurant' },
      subcategory: { name: 'Spa', slug: 'spa' },
    })

    expect(schema['@type']).toBe('LocalBusiness')
  })

  it('never derives a specialized type from the description', () => {
    const schema = discoveryPoiSchema({
      ...discoveryPoi,
      description: 'Restaurant, hôtel, spa et musée avec activités touristiques.',
      category: { name: 'Services', slug: 'services' },
      subcategory: { name: 'Autre', slug: 'autre' },
    })

    expect(schema['@type']).toBe('LocalBusiness')
  })

  it.each([
    [{ category: { name: 'Culture', slug: 'culture' }, subcategory: { name: 'Musée', slug: 'musee' } }, 'Museum'],
    [{ category: { name: 'Activité touristique', slug: 'activite-touristique' }, subcategory: null }, 'TouristAttraction'],
    [{ category: { name: 'Restaurants', slug: 'restaurants' }, subcategory: { name: 'Bistrot', slug: 'bistrot' } }, 'LocalBusiness'],
  ] as const)('chooses the schema type only from canonical taxonomy slugs: %j', (taxonomy, expectedType) => {
    const schema = discoveryPoiSchema({ ...discoveryPoi, ...taxonomy })

    expect(schema['@type']).toBe(expectedType)
  })

  it('emits only POI facts visible on the public detail page', () => {
    const schema = discoveryPoiSchema(discoveryPoi)
    const serialized = JSON.stringify(schema)

    expect(schema).toMatchObject({
      '@type': 'Museum',
      name: discoveryPoi.name,
      description: discoveryPoi.description,
      image: [discoveryPoi.hero_photo_url],
      address: {
        streetAddress: discoveryPoi.address,
        addressLocality: discoveryPoi.city.name,
      },
    })
    expect(serialized).not.toContain(discoveryPoi.city.postal_code)
    expect(serialized).not.toContain(discoveryPoi.city.region)
    expect(serialized).not.toContain(discoveryPoi.photos[1]!)
  })
})
