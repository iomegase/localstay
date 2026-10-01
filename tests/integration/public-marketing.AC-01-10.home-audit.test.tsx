/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from '@testing-library/react'
import type { MarketingLodgingCard } from '@/features/lodging-showcase/queries/public-lodgings'

const mockPathname = jest.fn<string | null, []>(() => '/')
jest.mock('next/navigation', () => ({ usePathname: () => mockPathname() }))
jest.mock('@/features/guide-demo/components/GuideDemoPhoneButton', () => ({
  GuideDemoPhoneButton: () => null,
}))

import { MarketingHome } from '@/features/marketing/components/MarketingHome'
import { MarketingHeader } from '@/features/marketing/components/MarketingHeader'
import { MarketingFooter } from '@/features/marketing/components/MarketingFooter'
import { marketingNavigationFor } from '@/features/marketing/components/marketing-navigation'

const lodging: MarketingLodgingCard = {
  id: 'lodging-1', slug: 'les-hauts-de-saint-gervais', city_slug: 'saint-gervais-les-bains',
  href: '/logements/les-hauts-de-saint-gervais', title: 'Les Hauts de Saint-Gervais',
  short_description: 'Appartement lumineux.', property_type: 'Appartement', amenities: [],
  public_area_label: 'saint gervais les bains', city_name: 'Saint-Gervais-les-Bains',
  cover_photo_url: '/demo/salon.webp', max_guests: 4, bedroom_count: 2, bathroom_count: 1,
  surface_m2: 65, external_booking_url: null, external_booking_platform: null,
}

describe('031 AC-01-10 — home audit corrections', () => {
  beforeEach(() => mockPathname.mockReturnValue('/'))

  it('(1) starts the H1 with the « Pays du Mont-Blanc » keyword, slogan kept', () => {
    render(<MarketingHome lodgings={[]} />)

    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.textContent).toMatch(/^Conciergerie dans le Pays du Mont-Blanc/)
    expect(h1).toHaveTextContent(/Votre logement,.*suivi localement.*Vos voyageurs,.*mieux accompagnés/)
    expect(screen.queryByText('Conciergerie locale en Haute-Savoie')).not.toBeInTheDocument()
  })

  it('(2) removes the hero horizontal padding so it aligns with the next sections', () => {
    render(<MarketingHome lodgings={[]} />)

    const content = screen.getByTestId('editorial-hero-content')
    expect(content.className).not.toMatch(/(^|\s)(sm:|xl:|min-\[\d+px\]:)?px-/)
  })

  it('(3)(4) renames the service card and the final call to action', () => {
    render(<MarketingHome lodgings={[]} />)

    const services = screen.getByRole('heading', { name: /Un accompagnement concret/ }).closest('section')!
    expect(within(services).getByRole('heading', { name: 'Accueil des voyageurs' })).toBeInTheDocument()
    expect(within(services).queryByRole('heading', { name: 'Accueil voyageurs' })).not.toBeInTheDocument()
    const final = screen.getByTestId('editorial-cta')
    expect(within(final).getByRole('link', { name: 'Nous contacter' })).toHaveAttribute('href', '/confier-mon-logement')
    expect(screen.queryByRole('link', { name: 'Échanger sur mon projet' })).not.toBeInTheDocument()
  })

  it('(5) shows the hyphenated commune and a descriptive photo alt on lodging cards', () => {
    render(<MarketingHome lodgings={[lodging]} />)

    const card = screen.getByRole('link', { name: 'Découvrir Les Hauts de Saint-Gervais' })
    expect(within(card).getByText('Saint-Gervais-les-Bains')).toBeInTheDocument()
    expect(within(card).queryByText('saint gervais les bains')).not.toBeInTheDocument()
    expect(card.querySelector('img')).toHaveAttribute('alt', 'Les Hauts de Saint-Gervais — Saint-Gervais-les-Bains')
  })

  it('(6) hides « Nos services » on / and points it to /#services elsewhere', () => {
    expect(marketingNavigationFor('/').map(item => item.label)).not.toContain('Nos services')
    expect(marketingNavigationFor('/logements')[0]).toEqual({ href: '/#services', label: 'Nos services' })
    expect(marketingNavigationFor(null)[0]).toEqual({ href: '/#services', label: 'Nos services' })

    const { unmount } = render(<MarketingHeader />)
    expect(within(screen.getByRole('navigation', { name: 'Navigation principale' })).queryByRole('link', { name: 'Nos services' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    expect(within(screen.getByRole('navigation', { name: 'Navigation mobile' })).queryByRole('link', { name: 'Nos services' })).not.toBeInTheDocument()
    unmount()

    mockPathname.mockReturnValue('/logements')
    render(<MarketingHeader />)
    expect(within(screen.getByRole('navigation', { name: 'Navigation principale' })).getByRole('link', { name: 'Nos services' })).toHaveAttribute('href', '/#services')
  })

  it('(7) cleans up the footer', () => {
    render(<MarketingFooter />)

    expect(screen.queryByRole('link', { name: 'Instagram' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'LinkedIn' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Découvrir' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Nos services' })).toHaveAttribute('href', '/#services')
    expect(screen.getByRole('link', { name: 'Mentions légales' })).toHaveAttribute('href', '/mentions-legales')
    expect(screen.getByRole('link', { name: 'Confidentialité' })).toHaveAttribute('href', '/confidentialite')
    expect(screen.getByRole('link', { name: 'CGU' })).toHaveAttribute('href', '/cgu')
    expect(screen.getByRole('link', { name: 'Nos logements' })).toHaveClass('min-h-8')
    expect(screen.getByTestId('marketing-footer-columns')).toHaveClass('grid-cols-2')
  })
})
