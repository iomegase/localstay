/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { MarketingFooter } from '@/features/marketing/components/MarketingFooter'
import { MarketingHeader } from '@/features/marketing/components/MarketingHeader'

describe('031-public-marketing-site navigation', () => {
  it('reuses the real Supabase authentication route from the marketing header', () => {
    render(<MarketingHeader />)

    expect(screen.getByRole('link', { name: /MyStay — Accueil/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /Se connecter à l’espace propriétaire/i })).toHaveAttribute(
      'href',
      '/auth/login',
    )
    expect(screen.getAllByRole('link', { name: /Confier mon logement/i })[0]).toHaveAttribute(
      'href',
      '/confier-mon-logement',
    )
  })

  it('opens the mobile navigation as a branded editorial panel', () => {
    render(<MarketingHeader />)

    expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toHaveTextContent(
      'Journal',
    )
    expect(screen.queryByRole('link', { name: 'Blog' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))

    const mobileNavigation = screen.getByRole('navigation', { name: 'Navigation mobile' })
    expect(within(mobileNavigation).getAllByRole('link').map(link => link.textContent)).toEqual([
      'Nos services',
      'Nos logements',
      'Séminaires',
      'Notre approche',
      'Journal',
      'Confier mon logement',
    ])
    expect(within(mobileNavigation).getByText('Guide démo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fermer le menu' })).toBeInTheDocument()
  })

  it('exposes the editorial routes and contact details in the footer', () => {
    render(<MarketingFooter />)

    expect(screen.getByRole('link', { name: 'Découvrir', exact: true })).toHaveAttribute(
      'href',
      '/decouvrir',
    )
    expect(screen.queryByRole('link', { name: 'Découvrir nos destinations', exact: true })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Nos logements' })).toHaveAttribute('href', '/logements')
    expect(screen.getByRole('link', { name: 'Séminaires' })).toHaveAttribute('href', '/seminaires')
    expect(screen.getByRole('link', { name: 'Notre approche' })).toHaveAttribute('href', '/concept')
    expect(screen.getByRole('link', { name: 'Le blog' })).toHaveAttribute('href', '/blog')
    expect(screen.getByRole('link', { name: 'bonjour@mystay.city' })).toHaveAttribute(
      'href',
      'mailto:bonjour@mystay.city',
    )
  })
})
