/** @jest-environment jsdom */

import React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DemoGuideApp } from '@/features/guide-demo/components/DemoGuideApp'

jest.mock('react-map-gl/mapbox', () => {
  const MockMap = React.forwardRef<
    { getMap: () => Record<string, jest.Mock> },
    { children: React.ReactNode; onClick?: () => void }
  >(({ children, onClick }, ref) => {
    React.useImperativeHandle(ref, () => ({
      getMap: () => ({
        addLayer: jest.fn(),
        easeTo: jest.fn(),
        fitBounds: jest.fn(),
        getLayer: jest.fn(() => true),
        getPitch: jest.fn(() => 0),
        getStyle: jest.fn(() => ({ layers: [] })),
        getZoom: jest.fn(() => 12),
      }),
    }))
    return (
      <div data-testid="mapbox-map" onClick={onClick}>
        {children}
      </div>
    )
  })
  MockMap.displayName = 'MockMap'

  return {
    __esModule: true,
    default: MockMap,
    Marker: ({
      children,
      onClick,
    }: {
      children: React.ReactNode
      onClick?: (event: { originalEvent: { stopPropagation: () => void } }) => void
    }) => (
      <div
        data-testid="mapbox-marker"
        onClick={event => {
          event.stopPropagation()
          onClick?.({ originalEvent: { stopPropagation: jest.fn() } })
        }}
      >
        {children}
      </div>
    ),
    Source: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="mapbox-source">{children}</div>
    ),
    Layer: () => <div data-testid="mapbox-layer" />,
  }
})

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
    const videoButton = within(guide).getByRole('button', {
      name: /Voir la vidéo du logement/i,
    })
    expect(videoButton).toBeDisabled()
    expect(videoButton).toHaveAttribute('aria-disabled', 'true')
    expect(
      within(guide).getByText(
        'Vidéo indisponible dans cette démonstration',
      ),
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
    expect(
      within(
        within(guide).getByRole('navigation', {
          name: 'Navigation de démonstration',
        }),
      ).getByText('Coups de cœur'),
    ).toBeInTheDocument()
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
    expect(screen.getByRole('heading', { name: 'Bienvenue' })).toBeInTheDocument()
    expect(guideButton).toHaveAttribute('aria-current', 'page')

    fireEvent.click(screen.getByRole('button', { name: 'Accueil' }))
    expect(
      screen.getByRole('heading', { name: 'Bienvenue au 305' }),
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe('/concept')
  })

  it.each([
    { destination: 'Nos logements', heading: 'Nos logements' },
    { destination: 'Blog', heading: 'Blog' },
    { destination: 'Nous contacter', heading: 'Votre hôte' },
  ])(
    'navigates to $destination from the local menu, closes it and focuses the destination heading',
    async ({ destination, heading }) => {
      const user = userEvent.setup()
      render(<DemoGuideApp />)

      const opener = screen.getByRole('button', { name: 'Ouvrir le menu' })
      await user.click(opener)
      const menu = screen.getByRole('navigation', {
        name: 'Menu de démonstration',
      })

      await user.click(
        within(menu).getByRole('button', { name: destination }),
      )

      const viewHeading = screen.getByRole('heading', { name: heading })
      expect(viewHeading).toBeInTheDocument()
      expect(
        screen.queryByRole('navigation', { name: 'Menu de démonstration' }),
      ).not.toBeInTheDocument()
      expect(window.location.pathname).toBe('/concept')
      expect(viewHeading).toHaveFocus()
      expect(opener).not.toHaveFocus()
    },
  )

  it('shows only the three public editorial destinations in the full-screen menu', async () => {
    const user = userEvent.setup()
    render(<DemoGuideApp />)

    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    const menu = screen.getByRole('navigation', {
      name: 'Menu de démonstration',
    })

    expect(
      within(menu).getAllByRole('button').map(button => button.textContent),
    ).toEqual(['Nos logements', 'Blog', 'Nous contacter'])
    expect(within(menu).queryByRole('button', { name: 'Accueil' })).toBeNull()
    expect(
      within(menu).queryByRole('button', { name: 'Guide du logement' }),
    ).toBeNull()
    expect(
      within(menu).queryByRole('button', { name: 'Coups de cœur' }),
    ).toBeNull()
    expect(within(menu).queryByRole('button', { name: 'Carte' })).toBeNull()
  })

  it('contains keyboard focus inside the modal menu', async () => {
    const user = userEvent.setup()
    render(<DemoGuideApp />)

    const opener = screen.getByRole('button', { name: 'Ouvrir le menu' })
    expect(opener).toHaveAttribute('aria-expanded', 'false')
    expect(opener).toHaveAttribute('aria-controls', 'demo-guide-menu')

    await user.click(opener)

    expect(opener).toHaveAttribute('aria-expanded', 'true')
    const dialog = screen.getByRole('dialog', {
      name: 'Menu de démonstration',
    })
    expect(dialog).toHaveAttribute('id', 'demo-guide-menu')
    expect(dialog).toHaveAttribute('aria-modal', 'true')

    const closeButton = within(dialog).getByRole('button', {
      name: 'Fermer le menu',
    })
    const lastMenuButton = within(dialog).getByRole('button', {
      name: 'Nous contacter',
    })
    expect(closeButton).toHaveFocus()

    await user.tab({ shift: true })
    expect(lastMenuButton).toHaveFocus()

    await user.tab()
    expect(closeButton).toHaveFocus()

    await user.tab()
    expect(
      within(dialog).getByRole('button', { name: 'Nos logements' }),
    ).toHaveFocus()
  })

  it('stops Escape at the internal menu and restores opener focus', async () => {
    const user = userEvent.setup()
    const parentEscapeHandler = jest.fn()
    document.addEventListener('keydown', parentEscapeHandler)

    try {
      render(<DemoGuideApp />)
      const opener = screen.getByRole('button', { name: 'Ouvrir le menu' })
      await user.click(opener)

      await user.keyboard('{Escape}')

      expect(parentEscapeHandler).not.toHaveBeenCalled()
      expect(
        screen.queryByRole('dialog', { name: 'Menu de démonstration' }),
      ).not.toBeInTheDocument()
      expect(opener).toHaveAttribute('aria-expanded', 'false')
      expect(opener).toHaveFocus()
    } finally {
      document.removeEventListener('keydown', parentEscapeHandler)
    }
  })

  it('closes the menu button and restores opener focus', async () => {
    const user = userEvent.setup()
    render(<DemoGuideApp />)

    const opener = screen.getByRole('button', { name: 'Ouvrir le menu' })
    await user.click(opener)
    await user.click(screen.getByRole('button', { name: 'Fermer le menu' }))

    expect(
      screen.queryByRole('dialog', { name: 'Menu de démonstration' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Bienvenue au 305' }),
    ).toBeInTheDocument()
    expect(opener).toHaveFocus()
  })
})
