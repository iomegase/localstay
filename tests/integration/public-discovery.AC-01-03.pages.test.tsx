/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { notFound } from 'next/navigation'
import type {
  DiscoveryCategory,
  DiscoveryCity,
  DiscoveryPoiCard,
  DiscoveryPoiDetail,
} from '@/features/public-discovery/types'
import {
  getDiscoveryCategory,
  getDiscoveryCity,
  getDiscoveryPoi,
} from '@/features/public-discovery/queries/public-discovery'
import { buildDiscoveryDirectionsHref } from '@/features/public-discovery/lib/directions'

jest.mock('next/navigation', () => ({ notFound: jest.fn() }))
jest.mock('@/features/public-discovery/queries/public-discovery', () => ({
  getDiscoveryCity: jest.fn(),
  getDiscoveryCategory: jest.fn(),
  getDiscoveryPoi: jest.fn(),
}))

const mockedCity = jest.mocked(getDiscoveryCity)
const mockedCategory = jest.mocked(getDiscoveryCategory)
const mockedPoi = jest.mocked(getDiscoveryPoi)

const primaryPoi: DiscoveryPoiCard = {
  name: 'Le Musée Alpin',
  slug: 'le-musee-alpin',
  address: '1 rue du Mont-Blanc',
  latitude: 45.8921,
  longitude: 6.7085,
  rating: 4.7,
  rating_count: 32,
  is_open_now: true,
  photo_url: 'https://images.example.com/musee.jpg',
  category: { name: 'Culture', slug: 'culture' },
  subcategory: { name: 'Musées', slug: 'musees' },
  distance_km: 0.4,
  zone: 'primary',
}

const nearbyPoi: DiscoveryPoiCard = {
  ...primaryPoi,
  name: 'Maison des Alpes',
  slug: 'maison-des-alpes',
  address: '20 route des Alpes',
  distance_km: 18.2,
  zone: 'nearby',
}

const city: DiscoveryCity = {
  name: 'Saint-Gervais-les-Bains',
  slug: 'saint-gervais-les-bains',
  postal_code: '74170',
  department: 'Haute-Savoie',
  region: 'Auvergne-Rhône-Alpes',
  categories: [{
    name: 'Culture',
    slug: 'culture',
    icon: 'landmark',
    sort_order: 1,
    poi_count: 2,
    pois: [primaryPoi, nearbyPoi],
  }],
}

const category: DiscoveryCategory = {
  name: 'Culture',
  slug: 'culture',
  icon: 'landmark',
  sort_order: 1,
  city: {
    name: city.name,
    slug: city.slug,
    postal_code: city.postal_code,
    department: city.department,
    region: city.region,
  },
  subcategories: [{ name: 'Musées', slug: 'musees' }],
  pois: [primaryPoi, nearbyPoi],
}

const poi: DiscoveryPoiDetail = {
  ...primaryPoi,
  description: 'Un musée consacré à l’histoire locale et au massif du Mont-Blanc.',
  phone: '+33450000000',
  website: 'https://musee.example.com/',
  hours: { '1': { open: '09:00', close: '18:00' } },
  photos: [primaryPoi.photo_url],
  hero_photo_url: primaryPoi.photo_url,
  city: category.city,
}

function jsonLd(container: HTMLElement): Array<Record<string, unknown>> {
  return [...container.querySelectorAll('script[type="application/ld+json"]')]
    .map(script => JSON.parse(script.textContent ?? '{}') as Record<string, unknown>)
}

function expectPublicSurface(container: HTMLElement, h1: RegExp) {
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  expect(screen.getByRole('heading', { level: 1, name: h1 })).toBeInTheDocument()
  expect(screen.getByTestId('marketing-stage')).toBeInTheDocument()
  expect(container.textContent).not.toMatch(/ownerRecommendationNote|lodging_id|recommandation de votre hôte|votre hôte/i)
  expect(container.querySelector('[data-testid="bottom-navigation"]')).toBeNull()
}

describe('041 public discovery pages', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders the City page from one public query with only canonical discovery links', async () => {
    mockedCity.mockResolvedValue(city)
    const { default: CityPage } = await import('@/app/(public)/decouvrir/[city-slug]/page')

    const { container } = render(await CityPage({
      params: Promise.resolve({ 'city-slug': city.slug }),
    }))

    expect(mockedCity).toHaveBeenCalledTimes(1)
    expectPublicSurface(container, /Découvrir Saint-Gervais-les-Bains/i)
    expect(screen.getByRole('link', { name: /Culture/i })).toHaveAttribute(
      'href',
      '/decouvrir/saint-gervais-les-bains/culture',
    )
    const hrefs = [...container.querySelectorAll('a')].map(link => link.getAttribute('href'))
    expect(hrefs.some(href => href?.startsWith('/guide/'))).toBe(false)
    expect(jsonLd(container).map(item => item['@type'])).toEqual([
      'BreadcrumbList',
      'ItemList',
    ])
  })

  it('renders the Category page with separate primary and nearby public POIs', async () => {
    mockedCategory.mockResolvedValue(category)
    const { default: CategoryPage } = await import(
      '@/app/(public)/decouvrir/[city-slug]/[category-slug]/page'
    )

    const { container } = render(await CategoryPage({
      params: Promise.resolve({ 'city-slug': city.slug, 'category-slug': category.slug }),
    }))

    expect(mockedCategory).toHaveBeenCalledTimes(1)
    expectPublicSurface(container, /Culture à Saint-Gervais-les-Bains/i)
    expect(screen.getByRole('heading', { name: 'Aux alentours' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Le Musée Alpin/i })).toHaveAttribute(
      'href',
      '/decouvrir/saint-gervais-les-bains/culture/le-musee-alpin',
    )
    expect(jsonLd(container).map(item => item['@type'])).toEqual([
      'BreadcrumbList',
      'ItemList',
    ])
  })

  it('omits the nearby section when the Category has no nearby public POI', async () => {
    mockedCategory.mockResolvedValue({ ...category, pois: [primaryPoi] })
    const { default: CategoryPage } = await import(
      '@/app/(public)/decouvrir/[city-slug]/[category-slug]/page'
    )

    render(await CategoryPage({
      params: Promise.resolve({ 'city-slug': city.slug, 'category-slug': category.slug }),
    }))

    expect(screen.queryByRole('heading', { name: 'Aux alentours' })).not.toBeInTheDocument()
  })

  it('renders the public POI facts, conditional actions, map and POI schema', async () => {
    mockedPoi.mockResolvedValue(poi)
    const { default: PoiPage } = await import(
      '@/app/(public)/decouvrir/[city-slug]/[category-slug]/[poi-slug]/page'
    )

    const { container } = render(await PoiPage({
      params: Promise.resolve({
        'city-slug': city.slug,
        'category-slug': category.slug,
        'poi-slug': poi.slug,
      }),
    }))

    expect(mockedPoi).toHaveBeenCalledTimes(1)
    expectPublicSurface(container, /^Le Musée Alpin$/i)
    expect(screen.getByText(poi.description)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Appeler/i })).toHaveAttribute('href', `tel:${poi.phone}`)
    expect(screen.getByRole('link', { name: /Site officiel/i })).toHaveAttribute('href', poi.website)
    expect(screen.getByRole('link', { name: /Itinéraire/i }).getAttribute('href')).toContain(
      encodeURIComponent(poi.address),
    )
    expect(screen.getByTestId('mini-map')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: `${poi.name} à ${poi.city.name}` })).toHaveAttribute(
      'fetchpriority',
      'high',
    )
    const schemas = jsonLd(container)
    expect(schemas.map(item => item['@type'])).toEqual([
      'BreadcrumbList',
      'LocalBusiness',
    ])
    const poiSchema = schemas[1]
    expect(poiSchema).toMatchObject({
      name: poi.name,
      description: poi.description,
      url: `https://www.mystay.city/decouvrir/${poi.city.slug}/${poi.category.slug}/${poi.slug}`,
      image: [poi.hero_photo_url],
      telephone: poi.phone,
      sameAs: [poi.website],
      address: {
        streetAddress: poi.address,
        addressLocality: poi.city.name,
      },
      geo: { latitude: poi.latitude, longitude: poi.longitude },
      aggregateRating: { ratingValue: poi.rating, ratingCount: poi.rating_count },
    })
    expect(screen.getByTestId('mini-map')).toHaveAttribute(
      'src',
      expect.stringContaining(`${poi.longitude},${poi.latitude}`),
    )
    expect(screen.getByText(`${poi.rating?.toLocaleString('fr-FR')} / 5 · ${poi.rating_count} avis`)).toBeInTheDocument()
    expect(screen.getByText('09:00–18:00')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'bonjour@mystay.city' })).toHaveAttribute(
      'href',
      'mailto:bonjour@mystay.city',
    )
    expect(screen.getByText('Haute-Savoie, France')).toBeInTheDocument()
  })

  it('omits unavailable POI actions without constructing an invalid public DTO', async () => {
    mockedPoi.mockResolvedValue({ ...poi, phone: null, website: null })
    const { default: PoiPage } = await import(
      '@/app/(public)/decouvrir/[city-slug]/[category-slug]/[poi-slug]/page'
    )

    render(await PoiPage({
      params: Promise.resolve({
        'city-slug': city.slug,
        'category-slug': category.slug,
        'poi-slug': poi.slug,
      }),
    }))

    expect(screen.queryByRole('link', { name: /Appeler/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Site officiel/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Itinéraire/i })).toBeInTheDocument()
  })

  it('keeps the inherited coordinate fallback as a defensive utility outside the strict published DTO path', () => {
    expect(buildDiscoveryDirectionsHref({
      address: null,
      latitude: poi.latitude,
      longitude: poi.longitude,
    })).toContain(encodeURIComponent(`${poi.latitude},${poi.longitude}`))
  })

  it('renders eligible remote photos natively regardless of protocol or Next host configuration', async () => {
    const photoUrls = [
      'http://media.unlisted.test/http-photo.jpg',
      'https://media.unlisted.test/https-photo.jpg',
      'https://images.unsplash.com/configured-photo.jpg',
    ]
    mockedCity.mockResolvedValue({
      ...city,
      categories: [{
        ...city.categories[0]!,
        poi_count: photoUrls.length,
        pois: photoUrls.map((photo_url, index) => ({
          ...primaryPoi,
          name: `Adresse photo ${index + 1}`,
          slug: `adresse-photo-${index + 1}`,
          photo_url,
        })),
      }],
    })
    const { default: CityPage } = await import('@/app/(public)/decouvrir/[city-slug]/page')

    const { container } = render(await CityPage({
      params: Promise.resolve({ 'city-slug': city.slug }),
    }))

    const discoveryImages = [...container.querySelectorAll('article img')]
    expect(discoveryImages.map(image => image.getAttribute('src'))).toEqual(photoUrls)
    for (const image of discoveryImages) {
      expect(image).not.toHaveAttribute('data-nimg')
      expect(image).toHaveAttribute('referrerpolicy', 'no-referrer')
      expect(image.className).toContain('motion-reduce:transform-none')
    }
  })

  it('wires each route metadata to its public DTO and canonical discovery URL', async () => {
    mockedCity.mockResolvedValue(city)
    mockedCategory.mockResolvedValue(category)
    mockedPoi.mockResolvedValue(poi)
    const [{ generateMetadata: cityMetadata }, { generateMetadata: categoryMetadata }, { generateMetadata: poiMetadata }] = await Promise.all([
      import('@/app/(public)/decouvrir/[city-slug]/page'),
      import('@/app/(public)/decouvrir/[city-slug]/[category-slug]/page'),
      import('@/app/(public)/decouvrir/[city-slug]/[category-slug]/[poi-slug]/page'),
    ])

    const [cityResult, categoryResult, poiResult] = await Promise.all([
      cityMetadata({ params: Promise.resolve({ 'city-slug': city.slug }) }),
      categoryMetadata({ params: Promise.resolve({ 'city-slug': city.slug, 'category-slug': category.slug }) }),
      poiMetadata({ params: Promise.resolve({ 'city-slug': city.slug, 'category-slug': category.slug, 'poi-slug': poi.slug }) }),
    ])

    expect(cityResult.alternates?.canonical).toBe(`/decouvrir/${city.slug}`)
    expect(categoryResult.alternates?.canonical).toBe(`/decouvrir/${city.slug}/${category.slug}`)
    expect(poiResult.alternates?.canonical).toBe(`/decouvrir/${city.slug}/${category.slug}/${poi.slug}`)
    expect(cityResult.openGraph?.url).toBe(cityResult.alternates?.canonical)
    expect(categoryResult.openGraph?.url).toBe(categoryResult.alternates?.canonical)
    expect(poiResult.openGraph?.url).toBe(poiResult.alternates?.canonical)
  })

  it.each([
    ['City', () => import('@/app/(public)/decouvrir/[city-slug]/page'), mockedCity, { 'city-slug': city.slug }],
    ['Category', () => import('@/app/(public)/decouvrir/[city-slug]/[category-slug]/page'), mockedCategory, { 'city-slug': city.slug, 'category-slug': category.slug }],
    ['POI', () => import('@/app/(public)/decouvrir/[city-slug]/[category-slug]/[poi-slug]/page'), mockedPoi, { 'city-slug': city.slug, 'category-slug': category.slug, 'poi-slug': poi.slug }],
  ] as const)('calls notFound when the %s public query returns null', async (_label, load, query, params) => {
    query.mockResolvedValue(null)
    const { default: Page } = await load()

    render(await Page({ params: Promise.resolve(params) } as never))

    expect(notFound).toHaveBeenCalledTimes(1)
  })
})
