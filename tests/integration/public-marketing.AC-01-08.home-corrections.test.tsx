/** @jest-environment jsdom */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fireEvent, render, screen, within } from '@testing-library/react'

const mockListPublishedLodgings = jest.fn()
const mockGetDiscoveryIndex = jest.fn()

jest.mock('@/features/lodging-showcase/queries/public-lodgings', () => ({
  listPublishedLodgings: (...args: unknown[]) => mockListPublishedLodgings(...args),
}))
jest.mock('@/features/public-discovery/queries/public-discovery', () => ({
  getDiscoveryIndex: (...args: unknown[]) => mockGetDiscoveryIndex(...args),
}))
jest.mock('@/features/guide-demo/components/GuideDemoPhoneButton', () => ({
  GuideDemoPhoneButton: () => null,
}))

import HomePage from '@/app/(public)/page'
import { MarketingHome } from '@/features/marketing/components/MarketingHome'
import { MarketingHeader } from '@/features/marketing/components/MarketingHeader'

const discoveryCity = (slug: string, name: string) => ({
  slug, name, postal_code: '74170', department: null, region: null, pois: [],
})

describe('031 AC-01-08 — home corrections', () => {
  beforeEach(() => {
    mockListPublishedLodgings.mockResolvedValue([])
    mockGetDiscoveryIndex.mockResolvedValue([
      discoveryCity('saint-gervais-les-bains', 'Saint  Gervais les Bains'),
      discoveryCity('saint-nicolas-de-veroce', 'Saint-Nicolas-de-Véroce'),
    ])
  })

  it('(1) adds 40px between the hero eyebrow and the H1', () => {
    render(<MarketingHome lodgings={[]} />)

    // Depuis AC-01-10 (1), l'eyebrow est dans le H1 : l'écart est porté par le slogan.
    expect(screen.getByText(/Votre logement,/).closest('span')).toHaveClass('mt-10')
  })

  it('(2) labels every former « Confier mon logement » button « Nous contacter », still pointing to the owner form', () => {
    render(<MarketingHome lodgings={[]} />)

    expect(screen.queryByRole('link', { name: 'Confier mon logement' })).not.toBeInTheDocument()
    const contacts = screen.getAllByRole('link', { name: 'Nous contacter' })
    expect(contacts.length).toBeGreaterThanOrEqual(3)
    contacts.forEach(link => expect(link).toHaveAttribute('href', '/confier-mon-logement'))
  })

  it('(2) uses « Nous contacter » in the header mobile menu too', () => {
    render(<MarketingHeader />)
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))

    const mobile = screen.getByRole('navigation', { name: 'Navigation mobile' })
    expect(within(mobile).getByRole('link', { name: 'Nous contacter' })).toHaveAttribute('href', '/confier-mon-logement')
  })

  it('(2) leaves no button coded « Confier mon logement » in the public components', () => {
    const files = [
      'src/features/marketing/components/MarketingHome.tsx',
      'src/features/marketing/components/MarketingHeader.tsx',
      'src/features/marketing/components/MarketingMobileMenu.tsx',
      'src/features/public-discovery/components/DiscoveryCityView.tsx',
      'src/features/public-discovery/components/DiscoveryPoiView.tsx',
    ]
    for (const file of files) {
      const source = readFileSync(join(process.cwd(), file), 'utf8')
      expect({ file, hasOldLabel: />\s*Confier mon logement\s*</.test(source) }).toEqual({ file, hasOldLabel: false })
    }
  })

  it('(3) keeps the « Les logements confiés à MyStay » eyebrow on a single line', () => {
    render(<MarketingHome lodgings={[]} />)

    expect(screen.getByText('Les logements confiés à MyStay').closest('span')).toHaveClass('whitespace-nowrap')
  })

  it('(4) shows only communes with published discovery POIs, each card linking to /decouvrir', async () => {
    render(await HomePage())

    const territory = screen.getByTestId('home-territory')
    const cards = within(territory).getAllByRole('link')
    expect(cards.map(card => card.getAttribute('href'))).toEqual([
      '/decouvrir/saint-gervais-les-bains',
      '/decouvrir/saint-nicolas-de-veroce',
    ])
    expect(within(cards[0]).getByRole('heading', { level: 3 })).toHaveTextContent('Saint-Gervais-les-Bains')
    expect(within(cards[1]).getByRole('heading', { level: 3 })).toHaveTextContent('Saint-Nicolas-de-Véroce')
    for (const empty of ['Les Contamines-Montjoie', 'Megève', 'Chamonix']) {
      expect(within(territory).queryByText(empty)).not.toBeInTheDocument()
    }
  })

  it('(4) renders no territory card when no commune has published POIs', () => {
    render(<MarketingHome lodgings={[]} territoryCities={[]} />)

    expect(screen.queryByTestId('home-territory')).not.toBeInTheDocument()
  })
})
