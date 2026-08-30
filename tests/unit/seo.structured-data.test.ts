import {
  organizationSchema,
  websiteSchema,
  breadcrumbSchema,
  localBusinessSchema,
  touristAttractionSchema,
} from '@/features/seo/lib/structured-data'
import { organizationId } from '@/features/seo/lib/site'

const BASE = 'https://www.mystay.city'

const poiInput = {
  name: 'Jannett Glisse',
  description: 'Location de skis.',
  address: '141 Chem. des Prés',
  latitude: 45.85,
  longitude: 6.71,
  phone: '+33450000000',
  website: 'https://jannett.example.com',
  rating: 4.6,
  ratingCount: 32,
  hours: { '1': { open: '09:00', close: '18:00' } },
  photos: ['https://img/a.jpg'],
  cityName: 'Saint-Gervais-les-Bains',
  cityRegion: 'Auvergne-Rhône-Alpes',
  postalCode: '74170',
  path: '/guide/saint-gervais-les-bains/commerces/jannett-glisse',
}

describe('structured-data', () => {
  const realBase = process.env.NEXT_PUBLIC_BASE_URL
  beforeAll(() => { process.env.NEXT_PUBLIC_BASE_URL = BASE })
  afterAll(() => {
    if (realBase === undefined) delete process.env.NEXT_PUBLIC_BASE_URL
    else process.env.NEXT_PUBLIC_BASE_URL = realBase
  })

  it('emits the single verified MyStay Organization identity', () => {
    const s = organizationSchema()
    expect(organizationId()).toBe('https://www.mystay.city/#organization')
    expect(s).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': 'https://www.mystay.city/#organization',
      name: 'MyStay',
      url: BASE,
      logo: `${BASE}/mystay-logo-approved/mystay-logo-approved.png`,
      description:
        'Gestion de locations saisonnières en Haute-Savoie : accueil voyageurs, ménage, linge, intendance et guide digital MyStay.',
      email: 'bonjour@mystay.city',
      areaServed: 'Haute-Savoie, France',
    })
    expect(s.telephone).toBeUndefined()
    expect(s.sameAs).toBeUndefined()
  })

  it('references the stable Organization as the WebSite publisher', () => {
    const s = websiteSchema()
    expect(s['@type']).toBe('WebSite')
    expect(s.url).toBe(BASE)
    expect(s.publisher).toEqual({ '@id': 'https://www.mystay.city/#organization' })
  })

  it('breadcrumbSchema builds an ordered list with absolute item URLs', () => {
    const s = breadcrumbSchema([
      { name: 'Accueil', path: '/' },
      { name: 'Saint-Gervais', path: '/guide/saint-gervais-les-bains' },
    ])
    expect(s['@type']).toBe('BreadcrumbList')
    expect(s.itemListElement).toHaveLength(2)
    expect(s.itemListElement[0]).toMatchObject({ '@type': 'ListItem', position: 1, name: 'Accueil', item: `${BASE}/` })
    expect(s.itemListElement[1]).toMatchObject({ position: 2, item: `${BASE}/guide/saint-gervais-les-bains` })
  })

  it('localBusinessSchema maps address, geo, telephone, rating and opening hours', () => {
    const s = localBusinessSchema(poiInput)
    expect(s['@type']).toBe('LocalBusiness')
    expect(s.url).toBe(`${BASE}${poiInput.path}`)
    expect(s.address).toMatchObject({
      '@type': 'PostalAddress',
      streetAddress: '141 Chem. des Prés',
      addressLocality: 'Saint-Gervais-les-Bains',
      postalCode: '74170',
      addressRegion: 'Auvergne-Rhône-Alpes',
      addressCountry: 'FR',
    })
    expect(s.geo).toMatchObject({ '@type': 'GeoCoordinates', latitude: 45.85, longitude: 6.71 })
    expect(s.telephone).toBe('+33450000000')
    expect(s.aggregateRating).toMatchObject({ '@type': 'AggregateRating', ratingValue: 4.6, ratingCount: 32 })
    expect(s.openingHoursSpecification).toEqual([
      expect.objectContaining({ '@type': 'OpeningHoursSpecification', opens: '09:00', closes: '18:00' }),
    ])
    expect((s.openingHoursSpecification as Array<{ dayOfWeek: string }>)[0].dayOfWeek).toContain('Monday')
  })

  it('localBusinessSchema omits rating and telephone when absent', () => {
    const s = localBusinessSchema({ ...poiInput, rating: null, ratingCount: 0, phone: null })
    expect(s.aggregateRating).toBeUndefined()
    expect(s.telephone).toBeUndefined()
  })

  it('touristAttractionSchema is a Place-like attraction with geo', () => {
    const s = touristAttractionSchema(poiInput)
    expect(s['@type']).toBe('TouristAttraction')
    expect(s.geo).toMatchObject({ '@type': 'GeoCoordinates', latitude: 45.85, longitude: 6.71 })
    expect(s.name).toBe('Jannett Glisse')
  })
})
