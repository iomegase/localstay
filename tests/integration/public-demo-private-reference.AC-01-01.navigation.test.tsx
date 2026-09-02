/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    expect(screen.getByRole('heading', { name: 'Le 305' })).toBeInTheDocument()
    expect(guideButton).toHaveAttribute('aria-current', 'page')

    fireEvent.click(screen.getByRole('button', { name: 'Accueil' }))
    expect(
      screen.getByRole('heading', { name: 'Bienvenue au 305' }),
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe('/concept')
  })

  it.each([
    { destination: 'Accueil', heading: 'Bienvenue au 305' },
    { destination: 'Guide du logement', heading: 'Le 305' },
    { destination: 'Coups de cœur', heading: 'Nos coups de cœur' },
    { destination: 'Carte', heading: 'Carte des coups de cœur' },
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
      within(dialog).getByRole('button', { name: 'Accueil' }),
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
