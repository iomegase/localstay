import {
  discoveryItemListSchema,
  localBusinessSchema,
  touristAttractionSchema,
} from '@/features/seo/lib/structured-data'

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
})
