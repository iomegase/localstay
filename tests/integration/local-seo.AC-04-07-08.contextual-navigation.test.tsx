/** @jest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MarketingHeader } from '@/features/marketing/components/MarketingHeader'
import { MarketingFooter } from '@/features/marketing/components/MarketingFooter'
import { marketingNavigationFor } from '@/features/marketing/components/marketing-navigation'

const city = { slug: 'saint-gervais-les-bains' }

describe('046 AC-04-07 contextual navigation', () => {
  it.each(Array.from({ length: 8 }, (_, mask) => [mask]))('handles publication combination %i independently', mask => {
    const publication = { concierge: Boolean(mask & 1), seminar: Boolean(mask & 2), vacationRental: Boolean(mask & 4) }
    const links = marketingNavigationFor('/seminaires/saint-gervais-les-bains', { city, publication })
    expect(links.map(link => link.href)).toEqual([
      publication.concierge ? `/conciergerie/${city.slug}` : '/',
      publication.vacationRental ? `/locations-vacances/${city.slug}` : '/logements',
      publication.seminar ? `/seminaires/${city.slug}` : '/seminaires',
      '/journal',
    ])
  })

  it('keeps generic links on the home page outside local pages', () => {
    expect(marketingNavigationFor('/seminaires').map(link => link.href)).toEqual(['/', '/logements', '/seminaires', '/journal'])
    expect(marketingNavigationFor('/').map(link => link.href)).toContain('/')
  })

  it('uses the same local destinations on desktop and mobile, with inert logos', () => {
    render(<MarketingHeader localNavigation={{ city, publication: { concierge: true, seminar: true, vacationRental: true } }} />)
    const desktopLinks = within(screen.getByRole('navigation', { name: 'Navigation principale' })).getAllByRole('link').map(link => link.getAttribute('href'))
    expect(screen.queryByRole('link', { name: 'MyStay — Accueil' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByAltText('MyStay').closest('a, button')).toBeNull()
    const navigation = within(screen.getByRole('navigation', { name: 'Navigation mobile' }))
    expect(navigation.getAllByRole('link').slice(0, 4).map(link => link.getAttribute('href'))).toEqual(desktopLinks)
    fireEvent.click(navigation.getByRole('link', { name: 'Séminaires' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps the local footer logo visible without a link', () => {
    render(<MarketingFooter brandLinked={false} />)
    expect(screen.getByAltText('MyStay').closest('a, button')).toBeNull()
  })
})
