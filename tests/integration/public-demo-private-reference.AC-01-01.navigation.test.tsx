/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { DemoGuideApp } from '@/features/guide-demo/components/DemoGuideApp'

describe('045-public-demo-private-guide-reference autonomous navigation', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/concept')
  })

  it('renders the fictional private-guide home hierarchy without links', () => {
    render(<DemoGuideApp />)

    const guide = screen.getByTestId('autonomous-demo-guide')
    expect(guide).toHaveAttribute('data-guide-mode', 'demo')
    expect(
      within(guide).getByRole('heading', { name: 'Bienvenue au 305' }),
    ).toBeInTheDocument()
    expect(
      within(guide).getByText('Logement fictif · démonstration'),
    ).toBeInTheDocument()
    expect(
      within(guide).getByRole('button', {
        name: /Voir la vidéo du logement/i,
      }),
    ).toBeInTheDocument()
    expect(
      within(guide).getByRole('button', {
        name: /Découvrir le livret d’accueil/i,
      }),
    ).toBeInTheDocument()
    expect(
      within(guide).getByRole('button', { name: /Explorer Saint-Gervais/i }),
    ).toBeInTheDocument()

    const gpsButton = within(guide).getByRole('button', {
      name: /Activer mon GPS/i,
    })
    expect(gpsButton).toBeDisabled()
    expect(gpsButton).toHaveAttribute('aria-disabled', 'true')
    expect(within(guide).getByText(/désactivé dans la démonstration/i)).toBeInTheDocument()
    expect(guide.querySelectorAll('a')).toHaveLength(0)
  })

  it('switches bottom-navigation views locally without changing the URL', () => {
    render(<DemoGuideApp />)

    const guideButton = screen.getByRole('button', { name: 'Guide logement' })
    expect(screen.getByRole('button', { name: 'Accueil' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    fireEvent.click(guideButton)
    expect(screen.getByRole('heading', { name: 'Le 305' })).toBeInTheDocument()
    expect(guideButton).toHaveAttribute('aria-current', 'page')

    fireEvent.click(screen.getByRole('button', { name: 'Accueil' }))
    expect(
      screen.getByRole('heading', { name: 'Bienvenue au 305' }),
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe('/concept')
  })

  it('navigates from the local menu and closes the overlay', () => {
    render(<DemoGuideApp />)

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))

    const menu = screen.getByRole('navigation', {
      name: 'Menu de démonstration',
    })
    expect(within(menu).getByRole('button', { name: 'Nos logements' })).toBeInTheDocument()
    expect(within(menu).getByRole('button', { name: 'Blog' })).toBeInTheDocument()
    expect(within(menu).getByRole('button', { name: 'Nous contacter' })).toBeInTheDocument()

    fireEvent.click(within(menu).getByRole('button', { name: 'Blog' }))
    expect(screen.getByRole('heading', { name: 'Blog' })).toBeInTheDocument()
    expect(
      screen.queryByRole('navigation', { name: 'Menu de démonstration' }),
    ).not.toBeInTheDocument()
    expect(window.location.pathname).toBe('/concept')
  })

  it('closes the menu without navigating', () => {
    render(<DemoGuideApp />)

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Fermer le menu' }))

    expect(
      screen.queryByRole('navigation', { name: 'Menu de démonstration' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Bienvenue au 305' }),
    ).toBeInTheDocument()
  })
})
