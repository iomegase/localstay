/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'

const mockListPublishedLocalLandingSummaries = jest.fn()

jest.mock('@/features/lodging-showcase/queries/public-lodgings', () => ({
  listPublishedLodgings: jest.fn(async () => []),
}))
jest.mock('@/features/local-seo/queries/landing-pages', () => ({
  listPublishedLocalLandingSummaries: (...args: unknown[]) => mockListPublishedLocalLandingSummaries(...args),
}))

import LodgingsPage from '@/app/(public)/logements/page'
import SeminarsPage from '@/app/(public)/seminaires/page'
import OwnerContactPage from '@/app/(public)/confier-mon-logement/page'

describe('046 local SEO hub links', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockListPublishedLocalLandingSummaries.mockResolvedValue([
      {
        id: 'destination-saint-gervais',
        city: { id: 'city-saint-gervais', slug: 'saint-gervais-les-bains', name: 'Saint-Gervais-les-Bains' },
        publication: { concierge: true, seminar: true, vacationRental: true },
        publicLodgingCount: 1,
      },
      {
        id: 'destination-saint-nicolas',
        city: { id: 'city-saint-nicolas', slug: 'saint-nicolas-de-veroce', name: 'Saint-Nicolas-de-Véroce' },
        publication: { concierge: true, seminar: true, vacationRental: false },
        publicLodgingCount: 0,
      },
    ])
  })

  it('links the lodging hub only to published rental destinations', async () => {
    render(await LodgingsPage())

    expect(screen.getByRole('link', { name: 'Locations à Saint-Gervais-les-Bains' })).toHaveAttribute(
      'href',
      '/locations-vacances/saint-gervais-les-bains',
    )
    expect(screen.queryByRole('link', { name: 'Locations à Saint-Nicolas-de-Véroce' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Locations à Megève' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Locations à Combloux' })).not.toBeInTheDocument()
  })

  it('links the seminar hub only to persisted published seminar destinations', async () => {
    const { unmount } = render(await SeminarsPage())

    expect(screen.getByRole('link', { name: 'Séminaire à Saint-Gervais-les-Bains' })).toHaveAttribute(
      'href',
      '/seminaires/saint-gervais-les-bains',
    )
    expect(screen.getByRole('link', { name: 'Séminaire à Saint-Nicolas-de-Véroce' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Séminaire à Megève' })).not.toBeInTheDocument()
    unmount()
  })

  it('links the owner hub only to persisted published concierge destinations', async () => {
    render(await OwnerContactPage())

    expect(screen.getByRole('link', { name: 'Conciergerie à Saint-Gervais-les-Bains' })).toHaveAttribute(
      'href',
      '/conciergerie/saint-gervais-les-bains',
    )
    expect(screen.getByRole('link', { name: 'Conciergerie à Saint-Nicolas-de-Véroce' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Conciergerie à Combloux' })).not.toBeInTheDocument()
  })
})
