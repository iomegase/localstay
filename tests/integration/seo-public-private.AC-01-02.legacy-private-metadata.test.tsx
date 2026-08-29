/** @jest-environment node */

const mockGetActiveLodgingContext = jest.fn()
const mockGetDiscoveryCity = jest.fn()
const mockGetDiscoveryCategory = jest.fn()
const mockGetDiscoveryPoi = jest.fn()
const mockGetCityForSeo = jest.fn()
const mockGetCategoryForSeo = jest.fn()
const mockGetPoiDetail = jest.fn()
const mockGetEventBySlug = jest.fn()
const mockGetPublishedTrail = jest.fn()

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: () => mockGetActiveLodgingContext(),
}))

jest.mock('@/features/public-discovery/queries/public-discovery', () => ({
  getDiscoveryCity: (...args: unknown[]) => mockGetDiscoveryCity(...args),
  getDiscoveryCategory: (...args: unknown[]) => mockGetDiscoveryCategory(...args),
  getDiscoveryPoi: (...args: unknown[]) => mockGetDiscoveryPoi(...args),
}))

jest.mock('@/features/seo/queries/page-data', () => ({
  getCityForSeo: (...args: unknown[]) => mockGetCityForSeo(...args),
  getCategoryForSeo: (...args: unknown[]) => mockGetCategoryForSeo(...args),
}))

jest.mock('@/features/categories/queries/poi-detail', () => ({
  getPoiDetail: (...args: unknown[]) => mockGetPoiDetail(...args),
}))

jest.mock('@/features/events-public/queries/agenda', () => ({
  cityHasUpcomingEventsBySlug: jest.fn(),
  getCityAgenda: jest.fn(),
  getEventBySlug: (...args: unknown[]) => mockGetEventBySlug(...args),
}))

jest.mock('@/features/trails-acquisition/queries/public-trails', () => ({
  getPublishedTrail: (...args: unknown[]) => mockGetPublishedTrail(...args),
}))

import { metadata as leLogementMetadata } from '@/app/(public)/le-logement/page'
import { metadata as recommendationsMetadata } from '@/app/(public)/nos-recommandations/page'
import { metadata as mapMetadata } from '@/app/(public)/map/page'
import { metadata as favoritesMetadata } from '@/app/(public)/mes-favoris/page'
import { metadata as privateServicesMetadata } from '@/app/(public)/services-prives/page'
import { metadata as contactMetadata } from '@/app/(public)/contact/page'
import { generateMetadata as generateCityMetadata } from '@/app/(public)/guide/[city-slug]/page'
import { generateMetadata as generateCategoryMetadata } from '@/app/(public)/guide/[city-slug]/[category-slug]/page'
import { generateMetadata as generatePoiMetadata } from '@/app/(public)/guide/[city-slug]/[category-slug]/[poi-slug]/page'
import { generateMetadata as generateAgendaMetadata } from '@/app/(public)/guide/[city-slug]/agenda/page'
import { generateMetadata as generateEventMetadata } from '@/app/(public)/guide/[city-slug]/agenda/[event-slug]/page'
import { generateMetadata as generateTrailStartMetadata } from '@/app/(public)/guide/[city-slug]/[category-slug]/[poi-slug]/start/page'

const expectedRobots = {
  index: false,
  follow: false,
  noarchive: true,
}

function expectPrivateMetadata(metadata: {
  robots?: unknown
  alternates?: unknown
}) {
  expect(metadata.robots).toEqual(expectedRobots)
  expect(metadata.alternates).toBeUndefined()
}

describe('042 SEO private metadata — AC-01-02', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetActiveLodgingContext.mockResolvedValue(null)
  })

  it.each([
    ['/le-logement', leLogementMetadata],
    ['/nos-recommandations', recommendationsMetadata],
    ['/map', mapMetadata],
    ['/mes-favoris', favoritesMetadata],
    ['/services-prives', privateServicesMetadata],
    ['/contact', contactMetadata],
  ])('applies the exact policy to historical private route %s', (_path, metadata) => {
    expectPrivateMetadata(metadata)
  })

  it('applies the exact policy to the legacy City metadata, including not-found', async () => {
    mockGetDiscoveryCity.mockResolvedValueOnce({ name: 'Annecy', slug: 'annecy', categories: [] })
    expectPrivateMetadata(await generateCityMetadata({
      params: Promise.resolve({ 'city-slug': 'annecy' }),
    }))

    mockGetDiscoveryCity.mockResolvedValueOnce(null)
    expectPrivateMetadata(await generateCityMetadata({
      params: Promise.resolve({ 'city-slug': 'missing' }),
    }))
  })

  it('keeps both active-stay City metadata branches on the exact policy', async () => {
    mockGetActiveLodgingContext.mockResolvedValue({ lodgingId: 'lodging-1' })
    mockGetCityForSeo.mockResolvedValueOnce({ name: 'Annecy', region: 'Haute-Savoie', slug: 'annecy' })
    expectPrivateMetadata(await generateCityMetadata({
      params: Promise.resolve({ 'city-slug': 'annecy' }),
    }))

    mockGetCityForSeo.mockResolvedValueOnce(null)
    expectPrivateMetadata(await generateCityMetadata({
      params: Promise.resolve({ 'city-slug': 'missing' }),
    }))
  })

  it('applies the exact policy to the legacy category metadata, including not-found', async () => {
    mockGetDiscoveryCategory.mockResolvedValueOnce({
      name: 'Restaurants',
      slug: 'restaurants',
      city: { name: 'Annecy', slug: 'annecy' },
      pois: [],
    })
    expectPrivateMetadata(await generateCategoryMetadata({
      params: Promise.resolve({ 'city-slug': 'annecy', 'category-slug': 'restaurants' }),
      searchParams: Promise.resolve({}),
    }))

    mockGetDiscoveryCategory.mockResolvedValueOnce(null)
    expectPrivateMetadata(await generateCategoryMetadata({
      params: Promise.resolve({ 'city-slug': 'annecy', 'category-slug': 'missing' }),
      searchParams: Promise.resolve({}),
    }))
  })

  it('keeps both active-stay category metadata branches on the exact policy', async () => {
    mockGetActiveLodgingContext.mockResolvedValue({ lodgingId: 'lodging-1' })
    mockGetCategoryForSeo.mockResolvedValueOnce({ cityName: 'Annecy', categoryName: 'Restaurants' })
    expectPrivateMetadata(await generateCategoryMetadata({
      params: Promise.resolve({ 'city-slug': 'annecy', 'category-slug': 'restaurants' }),
      searchParams: Promise.resolve({}),
    }))

    mockGetCategoryForSeo.mockResolvedValueOnce(null)
    expectPrivateMetadata(await generateCategoryMetadata({
      params: Promise.resolve({ 'city-slug': 'annecy', 'category-slug': 'missing' }),
      searchParams: Promise.resolve({}),
    }))
  })

  it('applies the exact policy to legacy POI metadata, including not-found', async () => {
    mockGetDiscoveryPoi.mockResolvedValueOnce({
      name: 'Le Semnoz',
      slug: 'le-semnoz',
      description: 'Panorama local.',
      hero_photo_url: null,
      city: { name: 'Annecy', slug: 'annecy' },
      category: { name: 'Activités', slug: 'activites' },
    })
    expectPrivateMetadata(await generatePoiMetadata({ params: Promise.resolve({
      'city-slug': 'annecy',
      'category-slug': 'activites',
      'poi-slug': 'le-semnoz',
    }) }))

    mockGetDiscoveryPoi.mockResolvedValueOnce(null)
    expectPrivateMetadata(await generatePoiMetadata({ params: Promise.resolve({
      'city-slug': 'annecy',
      'category-slug': 'activites',
      'poi-slug': 'missing',
    }) }))
  })

  it('keeps both active-stay POI metadata branches on the exact policy', async () => {
    mockGetActiveLodgingContext.mockResolvedValue({ lodgingId: 'lodging-1' })
    mockGetPoiDetail.mockResolvedValueOnce({
      name: 'Le Semnoz',
      category: { name: 'Activités' },
      city: { name: 'Annecy' },
    })
    expectPrivateMetadata(await generatePoiMetadata({ params: Promise.resolve({
      'city-slug': 'annecy',
      'category-slug': 'activites',
      'poi-slug': 'le-semnoz',
    }) }))

    mockGetPoiDetail.mockResolvedValueOnce(null)
    expectPrivateMetadata(await generatePoiMetadata({ params: Promise.resolve({
      'city-slug': 'annecy',
      'category-slug': 'activites',
      'poi-slug': 'missing',
    }) }))
  })

  it('applies the exact policy to the legacy agenda', async () => {
    expectPrivateMetadata(await generateAgendaMetadata({
      params: Promise.resolve({ 'city-slug': 'annecy' }),
    }))
  })

  it('applies the exact policy to legacy event metadata, including not-found', async () => {
    mockGetEventBySlug.mockResolvedValueOnce({ title: 'Fête du lac', description: 'Événement local.' })
    expectPrivateMetadata(await generateEventMetadata({ params: Promise.resolve({
      'city-slug': 'annecy',
      'event-slug': 'fete-du-lac',
    }) }))

    mockGetEventBySlug.mockResolvedValueOnce(null)
    expectPrivateMetadata(await generateEventMetadata({ params: Promise.resolve({
      'city-slug': 'annecy',
      'event-slug': 'missing',
    }) }))
  })

  it('removes the canonical and follow override from trail-start metadata, including not-found', async () => {
    mockGetPublishedTrail.mockResolvedValueOnce({ name: 'Tour du lac' })
    expectPrivateMetadata(await generateTrailStartMetadata({ params: Promise.resolve({
      'city-slug': 'annecy',
      'category-slug': 'randonnees',
      'poi-slug': 'tour-du-lac',
    }) }))

    mockGetPublishedTrail.mockResolvedValueOnce(null)
    expectPrivateMetadata(await generateTrailStartMetadata({ params: Promise.resolve({
      'city-slug': 'annecy',
      'category-slug': 'randonnees',
      'poi-slug': 'missing',
    }) }))
  })
})
