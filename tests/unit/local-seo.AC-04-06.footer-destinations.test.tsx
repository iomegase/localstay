/** @jest-environment jsdom */

import { render, screen, within } from '@testing-library/react'

const mockListSummaries = jest.fn()
jest.mock('@/features/local-seo/queries/landing-pages', () => ({
  listPublishedLocalLandingSummaries: (...args: unknown[]) => mockListSummaries(...args),
}))

import { getFooterLocalLandingLinks } from '@/features/local-seo/queries/footer-links'
import { MarketingFooter } from '@/features/marketing/components/MarketingFooter'
import { FooterDestinationsProvider } from '@/features/marketing/components/FooterDestinations'

const summary = (name: string, slug: string, publication: { concierge: boolean; seminar: boolean; vacationRental: boolean }) => ({
  id: slug,
  city: { id: slug, name, slug },
  publication,
  publicLodgingCount: publication.vacationRental ? 2 : 0,
})

describe('046 AC-04-06 — footer « Nos destinations »', () => {
  beforeEach(() => mockListSummaries.mockReset())

  it('builds links for published local pages only, grouped by intent, with clean city names', async () => {
    mockListSummaries.mockResolvedValue([
      summary('Saint  Gervais les Bains', 'saint-gervais-les-bains', { concierge: true, seminar: true, vacationRental: true }),
      summary('Saint-Nicolas-de-Véroce', 'saint-nicolas-de-veroce', { concierge: true, seminar: true, vacationRental: false }),
    ])

    await expect(getFooterLocalLandingLinks()).resolves.toEqual({
      vacationRental: [{ name: 'Saint Gervais les Bains', href: '/locations-vacances/saint-gervais-les-bains' }],
      concierge: [
        { name: 'Saint Gervais les Bains', href: '/conciergerie/saint-gervais-les-bains' },
        { name: 'Saint-Nicolas-de-Véroce', href: '/conciergerie/saint-nicolas-de-veroce' },
      ],
      seminar: [
        { name: 'Saint Gervais les Bains', href: '/seminaires/saint-gervais-les-bains' },
        { name: 'Saint-Nicolas-de-Véroce', href: '/seminaires/saint-nicolas-de-veroce' },
      ],
    })
  })

  it('returns no links when the data cannot be read, without throwing', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    mockListSummaries.mockRejectedValue(new Error('db down'))

    await expect(getFooterLocalLandingLinks()).resolves.toEqual({ vacationRental: [], concierge: [], seminar: [] })
  })

  it('renders three columns whose titles link to the hubs, hiding empty columns', () => {
    render(
      <FooterDestinationsProvider
        value={{
          vacationRental: [],
          concierge: [{ name: 'Saint-Gervais-les-Bains', href: '/conciergerie/saint-gervais-les-bains' }],
          seminar: [{ name: 'Saint-Gervais-les-Bains', href: '/seminaires/saint-gervais-les-bains' }],
        }}
      >
        <MarketingFooter />
      </FooterDestinationsProvider>,
    )

    const block = screen.getByRole('navigation', { name: 'Nos destinations' })
    expect(within(block).queryByRole('link', { name: 'Locations de vacances' })).not.toBeInTheDocument()
    expect(within(block).getByRole('link', { name: 'Conciergerie' })).toHaveAttribute('href', '/confier-mon-logement')
    expect(within(block).getByRole('link', { name: 'Séminaires' })).toHaveAttribute('href', '/seminaires')
    expect(
      within(block).getAllByRole('link', { name: 'Saint-Gervais-les-Bains' }).map(link => link.getAttribute('href')),
    ).toEqual(['/conciergerie/saint-gervais-les-bains', '/seminaires/saint-gervais-les-bains'])
  })

  it('renders no destinations block without any published page (or outside the provider)', () => {
    render(<MarketingFooter />)
    expect(screen.queryByRole('navigation', { name: 'Nos destinations' })).not.toBeInTheDocument()
  })
})
