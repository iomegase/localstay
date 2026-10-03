/** @jest-environment jsdom */

import React from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
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
    window.history.replaceState({}, '', '/seminaires')
  })

  it('054 AC-06-01: renders the stay home with the shared tabs and without links', () => {
    render(<DemoGuideApp />)

    const guide = screen.getByTestId('autonomous-demo-guide')
    expect(guide).toHaveAttribute('data-guide-mode', 'demo')
    expect(
      within(guide).getByRole('heading', { name: 'Bienvenue au 305' }),
    ).toBeInTheDocument()
    expect(within(guide).getByText('Votre guide de séjour')).toBeInTheDocument()
    expect(within(guide).getByRole('button', { name: /^Arrivée/ })).toBeInTheDocument()
    expect(within(guide).getByRole('button', { name: /^Wi-Fi/ })).toBeInTheDocument()
    const tabs = within(
      within(guide).getByRole('navigation', { name: 'Navigation du guide' }),
    ).getAllByRole('button')
    expect(tabs.map(tab => tab.textContent)).toEqual(['Séjour', 'Guide', 'Carte', 'Aide'])
    expect(guide.querySelectorAll('a')).toHaveLength(0)
  })

  it('switches bottom-navigation views locally without changing the URL', () => {
    render(<DemoGuideApp />)

    expect(screen.getByRole('button', { name: 'Séjour' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Aide' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Aide' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aide' })).toHaveAttribute('aria-current', 'page')
    // Spec 045 AC-01-08 : aucun lien tel: ni lien externe dans la démo.
    expect(screen.getByTestId('autonomous-demo-guide').querySelectorAll('a')).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: 'Séjour' }))
    expect(
      screen.getByRole('heading', { name: 'Bienvenue au 305' }),
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe('/seminaires')
  })

  it('054 AC-06-01: confirms arrival and departure locally without calling the API', async () => {
    const fetchSpy = jest.fn()
    const originalFetch = globalThis.fetch
    globalThis.fetch = fetchSpy as unknown as typeof fetch
    try {
      render(<DemoGuideApp />)

      fireEvent.click(screen.getByRole('button', { name: /^Arrivée/ }))
      fireEvent.click(screen.getAllByRole('tab')[1])
      expect(screen.queryByTestId('guide-key-box-code')).not.toBeInTheDocument()
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Je suis arrivé·e !' }))
      })
      expect(screen.getByText('Bienvenue au 305 !')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Revenir au séjour' }))
      fireEvent.click(screen.getByRole('button', { name: /^Départ/ }))
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Je suis parti·e' }))
      })
      expect(screen.getByText("Merci d'avoir séjourné au 305 !")).toBeInTheDocument()
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('055 AC-05-01: shows the transport row without any request, then live shuttles on demand', async () => {
    const fetchSpy = jest.fn(async () => ({
      ok: true,
      json: async () => ({ status: 'available', data: [], meta: { fetchedAt: '2026-10-02T08:00:00.000Z', sourceUpdatedAt: null, freshness: 'unknown' } }),
    }))
    const originalFetch = globalThis.fetch
    globalThis.fetch = fetchSpy as unknown as typeof fetch
    try {
      render(<DemoGuideApp />)
      expect(screen.queryByRole('region', { name: 'Prochaines navettes' })).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: /Se déplacer/ }))
      expect(screen.getByRole('button', { name: /Tramway du Mont-Blanc/ })).toBeInTheDocument()
      expect(fetchSpy).not.toHaveBeenCalled()

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Navette gratuite/ }))
      })
      expect(fetchSpy).toHaveBeenCalled()
      expect((fetchSpy.mock.calls as unknown as [string][]).every(([url]) => url.startsWith('/api/transport/facilibus/'))).toBe(true)
      expect(screen.getByTestId('autonomous-demo-guide').querySelectorAll('a')).toHaveLength(0)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it.each([
    { destination: 'Nos logements', heading: 'Des lieux suivis avec attention.' },
    { destination: 'Journal', heading: 'Inspirations... et conseils pour vos séjours' },
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
      expect(window.location.pathname).toBe('/seminaires')
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
    ).toEqual(['Nos logements', 'Journal', 'Nous contacter'])
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
