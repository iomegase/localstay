/** @jest-environment jsdom */

import { render, screen, within } from '@testing-library/react'
import { landingDate, landingDestinationRow } from '../fixtures/local-landing-management'

const mockDestinations = jest.fn()
const mockProfiles = jest.fn()
const mockListPublishedLodgings = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({ prisma: {
  localLandingDestination: { findMany: (...args: unknown[]) => mockDestinations(...args) },
  lodgingPublicProfile: { findMany: (...args: unknown[]) => mockProfiles(...args) },
} }))
jest.mock('@/features/lodging-showcase/queries/public-lodgings', () => ({
  listPublishedLodgings: (...args: unknown[]) => mockListPublishedLodgings(...args),
}))

import LodgingsPage from '@/app/(public)/logements/page'
import SeminarsPage from '@/app/(public)/seminaires/page'
import OwnerContactPage from '@/app/(public)/confier-mon-logement/page'

describe('048 persisted local landing hub links', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockListPublishedLodgings.mockResolvedValue([])
    const combloux = landingDestinationRow()
    combloux.id = 'destination-2'
    combloux.city_id = 'city-2'
    combloux.city = { ...combloux.city, id: 'city-2', slug: 'combloux', name: 'Combloux' }
    mockDestinations.mockResolvedValue([combloux, landingDestinationRow()])
    mockProfiles.mockResolvedValue([{ city_id: 'city-1' }])
  })

  it('shows only persisted concierge destinations on the owner hub', async () => {
    render(await OwnerContactPage())
    const links = within(screen.getByTestId('local-links-concierge'))

    expect(links.getByRole('link', { name: 'Conciergerie à Combloux' })).toHaveAttribute('href', '/conciergerie/combloux')
    expect(links.getByRole('link', { name: 'Conciergerie à Megève' })).toHaveAttribute('href', '/conciergerie/megeve')
    expect(links.queryByRole('link', { name: /Séminaire|Locations/ })).not.toBeInTheDocument()
    expect(links.getAllByRole('link').map(link => link.getAttribute('href'))).toEqual([
      '/conciergerie/combloux', '/conciergerie/megeve',
    ])
    expect(mockDestinations).toHaveBeenCalledTimes(1)
    expect(mockProfiles).toHaveBeenCalledTimes(1)
  })

  it('shows only persisted seminar destinations on the seminar hub', async () => {
    render(await SeminarsPage())
    const links = within(screen.getByTestId('local-links-seminar'))

    expect(links.getByRole('link', { name: 'Séminaire à Combloux' })).toHaveAttribute('href', '/seminaires/combloux')
    expect(links.getByRole('link', { name: 'Séminaire à Megève' })).toHaveAttribute('href', '/seminaires/megeve')
    expect(links.queryByRole('link', { name: /Conciergerie|Locations/ })).not.toBeInTheDocument()
  })

  it('shows only inventory-eligible vacation destinations on the lodging hub', async () => {
    render(await LodgingsPage())
    const links = within(screen.getByTestId('local-links-vacation-rental'))

    expect(links.getByRole('link', { name: 'Locations à Megève' })).toHaveAttribute('href', '/locations-vacances/megeve')
    expect(links.queryByRole('link', { name: 'Locations à Combloux' })).not.toBeInTheDocument()
    expect(links.queryByRole('link', { name: /Conciergerie|Séminaire/ })).not.toBeInTheDocument()
  })

  it.each(['archived', 'deleted', 'incomplete'])('removes an %s destination from every hub', async state => {
    const destination = landingDestinationRow()
    if (state === 'archived') destination.is_active = false
    if (state === 'deleted') destination.deleted_at = landingDate
    if (state === 'incomplete') destination.pages[0].h1 = ''
    mockDestinations.mockResolvedValue([destination])

    for (const [Page, intent] of [
      [OwnerContactPage, 'concierge'],
      [SeminarsPage, 'seminar'],
      [LodgingsPage, 'vacation-rental'],
    ] as const) {
      const { unmount } = render(await Page())
      expect(within(screen.getByTestId(`local-links-${intent}`)).queryAllByRole('link')).toEqual([])
      unmount()
    }
  })

  it('keeps services visible when only the vacation content is incomplete', async () => {
    const destination = landingDestinationRow()
    destination.pages[2].empty_copy = null
    mockDestinations.mockResolvedValue([destination])

    const { unmount } = render(await LodgingsPage())
    expect(within(screen.getByTestId('local-links-vacation-rental')).queryAllByRole('link')).toEqual([])
    unmount()
    render(await OwnerContactPage())
    expect(screen.getByRole('link', { name: 'Conciergerie à Megève' })).toHaveAttribute('href', '/conciergerie/megeve')
  })
})
