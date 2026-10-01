import { landingDate, landingDestinationRow } from '../fixtures/local-landing-management'

const mockDestinations = jest.fn()
const mockProfiles = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({ prisma: {
  localLandingDestination: { findMany: (...args: unknown[]) => mockDestinations(...args) },
  lodgingPublicProfile: { findMany: (...args: unknown[]) => mockProfiles(...args) },
} }))

import { getFooterLocalLandingLinks } from '@/features/local-seo/queries/footer-links'

// Depuis le 2026-10-01, les pages locales persistées sont exposées par le footer
// « Nos destinations » (spec 046 AC-04-06) et non plus par les hubs.
describe('048 persisted local landing links in the footer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const combloux = landingDestinationRow()
    combloux.id = 'destination-2'
    combloux.city_id = 'city-2'
    combloux.city = { ...combloux.city, id: 'city-2', slug: 'combloux', name: 'Combloux' }
    mockDestinations.mockResolvedValue([combloux, landingDestinationRow()])
    mockProfiles.mockResolvedValue([{ city_id: 'city-1' }])
  })

  it('lists only persisted concierge and seminar destinations, and inventory-eligible rentals', async () => {
    const links = await getFooterLocalLandingLinks()

    expect(links.concierge.map(link => link.href)).toEqual(['/conciergerie/combloux', '/conciergerie/megeve'])
    expect(links.seminar.map(link => link.href)).toEqual(['/seminaires/combloux', '/seminaires/megeve'])
    expect(links.vacationRental.map(link => link.href)).toEqual(['/locations-vacances/megeve'])
    expect(mockDestinations).toHaveBeenCalledTimes(1)
    expect(mockProfiles).toHaveBeenCalledTimes(1)
  })

  it.each(['archived', 'deleted', 'incomplete'])('removes an %s destination from every footer column', async state => {
    const destination = landingDestinationRow()
    if (state === 'archived') destination.is_active = false
    if (state === 'deleted') destination.deleted_at = landingDate
    if (state === 'incomplete') destination.pages[0].h1 = ''
    mockDestinations.mockResolvedValue([destination])

    await expect(getFooterLocalLandingLinks()).resolves.toEqual({ vacationRental: [], concierge: [], seminar: [] })
  })

  it('keeps services listed when only the vacation content is incomplete', async () => {
    const destination = landingDestinationRow()
    destination.pages[2].empty_copy = null
    mockDestinations.mockResolvedValue([destination])

    const links = await getFooterLocalLandingLinks()
    expect(links.vacationRental).toEqual([])
    expect(links.concierge).toEqual([{ name: 'Megève', href: '/conciergerie/megeve' }])
  })
})
