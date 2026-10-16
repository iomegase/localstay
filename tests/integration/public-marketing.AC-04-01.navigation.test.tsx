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
    // AC-01-26 : icône de connexion en rose, survol inchangé.
    expect(screen.getByRole('link', { name: /Se connecter à l’espace propriétaire/i })).toHaveClass('text-pink-600', 'hover:bg-pink-600', 'hover:text-white')
    // Spec 053 AC-02-05 : « Nous contacter » ouvre la modale contact par profil.
    expect(screen.queryByRole('link', { name: /Nous contacter/i })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Nous contacter' }).length).toBeGreaterThan(0)
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
      'Accueil',
      'Les Logements',
      'Séminaires',
      'Journal',
      'Connexion',
    ])
    expect(within(mobileNavigation).getByRole('button', { name: 'Nous contacter' })).toBeInTheDocument()
    // Spec 045 dépréciée (2026-10-05) : plus de bouton « Guide démo ».
    expect(within(mobileNavigation).queryByText('Guide démo')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fermer le menu' })).toBeInTheDocument()
    const loginLink = within(mobileNavigation).getByRole('link', { name: 'Connexion' })
    expect(loginLink).toHaveAttribute('href', '/auth/login')
    expect(loginLink).toHaveClass('text-pink-600')
    fireEvent.click(loginLink)
    expect(screen.queryByRole('dialog', { name: 'Menu MyStay' })).not.toBeInTheDocument()
  })

  it('keeps every desktop navigation label on one line', () => {
    render(<MarketingHeader />)

    const desktopNavigation = screen.getByRole('navigation', {
      name: 'Navigation principale',
    })

    within(desktopNavigation).getAllByRole('link').forEach(link => {
      expect(link).toHaveClass('whitespace-nowrap')
    })
  })

  it('exposes the editorial routes and contact details in the footer', () => {
    render(<MarketingFooter />)

    expect(screen.getByRole('link', { name: 'Découvrir', exact: true })).toHaveAttribute(
      'href',
      '/decouvrir',
    )
    expect(screen.queryByRole('link', { name: 'Découvrir nos destinations', exact: true })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Les Logements' })).toHaveAttribute('href', '/logements')
    expect(screen.getByRole('link', { name: 'Séminaires' })).toHaveAttribute('href', '/seminaires')
    expect(screen.queryByRole('link', { name: 'Notre approche' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Journal' })).toHaveAttribute('href', '/journal')
    expect(screen.getByRole('link', { name: '+33 6 07 85 90 58' })).toHaveAttribute('href', 'tel:+33607859058')
    expect(screen.getByRole('link', { name: 'bonjour@mystay.city' })).toHaveAttribute(
      'href',
      'mailto:bonjour@mystay.city',
    )
  })
})
