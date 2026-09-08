const mockDestinations = jest.fn()
const mockDestination = jest.fn()
const mockCities = jest.fn()
const mockProfiles = jest.fn()
const mockReviews = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({ prisma: {
  localLandingDestination: {
    findMany: (...args: unknown[]) => mockDestinations(...args),
    findFirst: (...args: unknown[]) => mockDestination(...args),
  },
  city: { findMany: (...args: unknown[]) => mockCities(...args) },
  lodgingPublicProfile: { findMany: (...args: unknown[]) => mockProfiles(...args) },
  localLandingReview: { findMany: (...args: unknown[]) => mockReviews(...args) },
} }))

import {
  getPublishedLocalLanding, listAdminLandingDestinations, listEligibleLandingCities,
  listPublishedLocalLandingPaths, listPublishedLocalLandingSummaries,
} from '@/features/local-seo/queries/landing-pages'
import { landingDate, landingDestinationRow, landingReviewRow } from '../fixtures/local-landing-management'

describe('048 AC-01/02/04 repository reads', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDestinations.mockResolvedValue([landingDestinationRow()])
    mockDestination.mockResolvedValue(landingDestinationRow())
    mockCities.mockResolvedValue([])
    mockProfiles.mockResolvedValue([])
    mockReviews.mockResolvedValue([])
  })

  it('lists the three publication states, eligible inventory and nondeleted review count', async () => {
    mockProfiles.mockResolvedValue([{ city_id: 'city-1' }, { city_id: 'city-1' }])
    mockReviews.mockResolvedValue([
      landingReviewRow(), { ...landingReviewRow(), id: 'archived', deleted_at: landingDate },
      { ...landingReviewRow(), id: 'other', destination_id: 'destination-2' },
    ])
    const [item] = await listAdminLandingDestinations()
    expect(item).toMatchObject({
      id: 'destination-1', city: { slug: 'megeve' }, publicLodgingCount: 2, reviewCount: 1,
      publication: { concierge: true, seminar: true, vacationRental: true }, contentIssues: [],
    })
    expect(item.pages.map(page => page.intent)).toEqual(['CONCIERGE', 'SEMINAR', 'VACATION_RENTAL'])
    expect(item.reviews).toHaveLength(2)
    expect(item.created_at).toBe(landingDate.toISOString())
    expect(mockDestinations).toHaveBeenCalledWith(expect.objectContaining({
      where: { deleted_at: null }, include: expect.objectContaining({ pages: { where: { deleted_at: null } } }),
    }))
    expect(mockReviews).toHaveBeenCalledWith(expect.objectContaining({ where: { destination_id: { in: ['destination-1'] } } }))
  })

  it('reports locations unpublished when inventory is absent', async () => {
    expect((await listAdminLandingDestinations())[0]).toMatchObject({
      publicLodgingCount: 0, publication: { concierge: true, seminar: true, vacationRental: false },
    })
  })

  it('allows repair of malformed JSON drafts without trusting their block shape', async () => {
    const destination = landingDestinationRow()
    destination.pages[0].highlights = [{ question: 'Wrong shape', answer: 'Wrong shape' }]
    mockDestinations.mockResolvedValue([destination])
    const [item] = await listAdminLandingDestinations()
    expect(item.pages[0].highlights).toEqual([])
    expect(item.contentIssues).toEqual(expect.arrayContaining([expect.objectContaining({ intent: 'CONCIERGE', field: 'highlights.0.title' })]))
    expect(item.publication).toEqual({ concierge: false, seminar: false, vacationRental: false })
  })

  it('selects only active Cities with no live destination, including soft-deleted configurations', async () => {
    await listEligibleLandingCities()
    expect(mockCities).toHaveBeenCalledWith({
      where: { is_active: true, deleted_at: null, OR: [
        { local_landing_destination: { is: null } },
        { local_landing_destination: { is: { deleted_at: { not: null } } } },
      ] },
      select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' },
    })
  })

  it.each(['CONCIERGE', 'SEMINAR'] as const)('publishes a valid %s service without lodging', async intent => {
    expect(await getPublishedLocalLanding('megeve', intent)).toMatchObject({
      city: { slug: 'megeve' }, page: { intent }, publicLodgingCount: 0,
    })
    expect(mockDestination).toHaveBeenCalledWith(expect.objectContaining({
      where: { is_active: true, deleted_at: null, city: { slug: 'megeve', is_active: true, deleted_at: null } },
    }))
  })

  it('publishes locations only with an eligible published profile', async () => {
    expect(await getPublishedLocalLanding('megeve', 'VACATION_RENTAL')).toBeNull()
    mockProfiles.mockResolvedValue([{ city_id: 'city-1' }])
    expect(await getPublishedLocalLanding('megeve', 'VACATION_RENTAL')).toMatchObject({ page: { intent: 'VACATION_RENTAL' } })
    expect(mockProfiles).toHaveBeenLastCalledWith({
      where: {
        city_id: { in: ['city-1'] }, publication_status: 'published', deleted_at: null,
        city: { is_active: true, deleted_at: null },
        lodging: { is_active: true, deleted_at: null, city: { is_active: true, deleted_at: null } },
      }, select: { city_id: true },
    })
  })

  it.each(['archived', 'deleted', 'inactive-city', 'deleted-city', 'deleted-page', 'invalid-service', 'missing-page'])('hides all services for %s state', async state => {
    const destination = landingDestinationRow()
    if (state === 'archived') destination.is_active = false
    if (state === 'deleted') destination.deleted_at = landingDate
    if (state === 'inactive-city') destination.city.is_active = false
    if (state === 'deleted-city') destination.city.deleted_at = landingDate
    if (state === 'deleted-page') destination.pages[1].deleted_at = landingDate
    if (state === 'invalid-service') destination.pages[1].cta_href = 'javascript:alert(1)'
    if (state === 'missing-page') destination.pages.splice(1, 1)
    mockDestination.mockResolvedValue(destination)
    expect(await getPublishedLocalLanding('megeve', 'CONCIERGE')).toBeNull()
  })

  it('rejects an incomplete vacation page even when eligible lodging exists', async () => {
    const destination = landingDestinationRow()
    destination.pages[2].empty_copy = null
    mockDestination.mockResolvedValue(destination)
    mockProfiles.mockResolvedValue([{ city_id: 'city-1' }])
    expect(await getPublishedLocalLanding('megeve', 'VACATION_RENTAL')).toBeNull()
    expect(await getPublishedLocalLanding('megeve', 'CONCIERGE')).not.toBeNull()
  })

  it('returns null when no destination exists', async () => {
    mockDestination.mockResolvedValue(null)
    expect(await getPublishedLocalLanding('unknown', 'CONCIERGE')).toBeNull()
    expect(mockProfiles).not.toHaveBeenCalled()
  })

  it('derives hub summaries and sitemap paths from the same validated publication state', async () => {
    expect(await listPublishedLocalLandingSummaries()).toEqual([expect.objectContaining({
      city: { id: 'city-1', name: 'Megève', slug: 'megeve' },
      publication: { concierge: true, seminar: true, vacationRental: false },
    })])
    expect(await listPublishedLocalLandingPaths(['megeve'])).toEqual(['/conciergerie/megeve', '/seminaires/megeve'])
    mockProfiles.mockResolvedValue([{ city_id: 'city-1' }])
    expect(await listPublishedLocalLandingPaths(['megeve', 'megeve', 'unknown'])).toEqual([
      '/conciergerie/megeve', '/seminaires/megeve', '/locations-vacances/megeve',
    ])
    expect(await listPublishedLocalLandingPaths([])).toEqual(['/conciergerie/megeve', '/seminaires/megeve'])
    mockDestinations.mockResolvedValue([{ ...landingDestinationRow(), is_active: false }])
    expect(await listPublishedLocalLandingPaths(['megeve'])).toEqual([])
  })
})
