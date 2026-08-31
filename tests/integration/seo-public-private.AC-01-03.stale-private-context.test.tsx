/** @jest-environment node */

const mockRequireActiveLodgingContext = jest.fn()
const mockGetCityAgenda = jest.fn()
const mockGetEventBySlug = jest.fn()
const mockGetCityForSeo = jest.fn()
const mockGetPublishedTrail = jest.fn()

jest.mock('@/features/public-menu/lib/private-stay-guard', () => ({
  requireActiveLodgingContext: (...args: unknown[]) =>
    mockRequireActiveLodgingContext(...args),
}))

jest.mock('@/features/events-public/queries/agenda', () => ({
  getCityAgenda: (...args: unknown[]) => mockGetCityAgenda(...args),
  getEventBySlug: (...args: unknown[]) => mockGetEventBySlug(...args),
}))

jest.mock('@/features/seo/queries/page-data', () => ({
  getCityForSeo: (...args: unknown[]) => mockGetCityForSeo(...args),
}))

jest.mock('@/features/trails-acquisition/queries/public-trails', () => ({
  getPublishedTrail: (...args: unknown[]) => mockGetPublishedTrail(...args),
}))

import ContactPage from '@/app/(public)/contact/page'
import MesFavorisPage from '@/app/(public)/mes-favoris/page'
import AgendaPage from '@/app/(public)/guide/[city-slug]/agenda/page'
import EventDetailPage, {
  generateMetadata as generateEventMetadata,
} from '@/app/(public)/guide/[city-slug]/agenda/[event-slug]/page'
import ContextualContactPage from '@/app/(public)/guide/[city-slug]/contact/page'
import ContextualMesFavorisPage from '@/app/(public)/guide/[city-slug]/mes-favoris/page'
import TrailNavigationStartPage, {
  generateMetadata as generateTrailStartMetadata,
} from '@/app/(public)/guide/[city-slug]/[category-slug]/[poi-slug]/start/page'
import TrailNavigationStartModal from '@/app/(public)/guide/[city-slug]/[category-slug]/@modal/(.)[poi-slug]/start/page'

const CITY_SLUG = 'saint-gervais-les-bains'
const ACCESS_DENIED = new Error('REDIRECT:/acces-reserve')

describe('042 private access — stale UUID cookie regression', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireActiveLodgingContext.mockRejectedValue(ACCESS_DENIED)
    mockGetCityAgenda.mockResolvedValue({ items: [], facets: [] })
    mockGetEventBySlug.mockResolvedValue({
      id: 'event-1',
      slug: 'fete-du-village',
      title: 'Fête du village',
      description: null,
      dateLabel: '29 août',
      types: [],
      venueName: null,
      address: null,
      communeName: null,
      images: [],
      website: null,
      phone: null,
      email: null,
      priceInfo: null,
    })
    mockGetCityForSeo.mockResolvedValue({
      name: 'Saint-Gervais-les-Bains',
      slug: CITY_SLUG,
      region: 'Auvergne-Rhône-Alpes',
    })
    mockGetPublishedTrail.mockResolvedValue({
      id: 'trail-1',
      slug: 'mont-joux',
      name: 'Mont Joux',
    })
  })

  it('rejects the private agenda before loading events', async () => {
    await expect(AgendaPage({
      params: Promise.resolve({ 'city-slug': CITY_SLUG }),
      searchParams: Promise.resolve({}),
    })).rejects.toThrow('REDIRECT:/acces-reserve')

    expect(mockRequireActiveLodgingContext).toHaveBeenCalledWith(CITY_SLUG)
    expect(mockGetCityAgenda).not.toHaveBeenCalled()
  })

  it('rejects an event page and its metadata before loading the event', async () => {
    const props = {
      params: Promise.resolve({
        'city-slug': CITY_SLUG,
        'event-slug': 'fete-du-village',
      }),
      searchParams: Promise.resolve({}),
    }

    await expect(EventDetailPage(props)).rejects.toThrow(
      'REDIRECT:/acces-reserve',
    )
    await expect(generateEventMetadata(props)).rejects.toThrow(
      'REDIRECT:/acces-reserve',
    )

    expect(mockRequireActiveLodgingContext).toHaveBeenCalledTimes(2)
    expect(mockRequireActiveLodgingContext).toHaveBeenCalledWith(CITY_SLUG)
    expect(mockGetEventBySlug).not.toHaveBeenCalled()
  })

  it('rejects root and contextual contact before loading contextual data', async () => {
    await expect(ContactPage()).rejects.toThrow('REDIRECT:/acces-reserve')
    await expect(ContextualContactPage({
      params: Promise.resolve({ 'city-slug': CITY_SLUG }),
    })).rejects.toThrow('REDIRECT:/acces-reserve')

    expect(mockRequireActiveLodgingContext).toHaveBeenNthCalledWith(1)
    expect(mockRequireActiveLodgingContext).toHaveBeenNthCalledWith(
      2,
      CITY_SLUG,
    )
    expect(mockGetCityForSeo).not.toHaveBeenCalled()
  })

  it('rejects root and contextual favorites before loading contextual data', async () => {
    await expect(MesFavorisPage()).rejects.toThrow('REDIRECT:/acces-reserve')
    await expect(ContextualMesFavorisPage({
      params: Promise.resolve({ 'city-slug': CITY_SLUG }),
    })).rejects.toThrow('REDIRECT:/acces-reserve')

    expect(mockRequireActiveLodgingContext).toHaveBeenNthCalledWith(1)
    expect(mockRequireActiveLodgingContext).toHaveBeenNthCalledWith(
      2,
      CITY_SLUG,
    )
    expect(mockGetCityForSeo).not.toHaveBeenCalled()
  })

  it('rejects direct and intercepted trail start routes before loading a trail', async () => {
    const params = Promise.resolve({
      'city-slug': CITY_SLUG,
      'category-slug': 'rando',
      'poi-slug': 'mont-joux',
    })

    await expect(TrailNavigationStartPage({ params })).rejects.toThrow(
      'REDIRECT:/acces-reserve',
    )
    await expect(TrailNavigationStartModal({ params })).rejects.toThrow(
      'REDIRECT:/acces-reserve',
    )
    await expect(generateTrailStartMetadata({ params })).rejects.toThrow(
      'REDIRECT:/acces-reserve',
    )

    expect(mockRequireActiveLodgingContext).toHaveBeenCalledTimes(3)
    expect(mockRequireActiveLodgingContext).toHaveBeenCalledWith(CITY_SLUG)
    expect(mockGetPublishedTrail).not.toHaveBeenCalled()
  })
})
