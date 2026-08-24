/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
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
