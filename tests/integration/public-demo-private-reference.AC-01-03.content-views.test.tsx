/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { DemoGuideApp } from '@/features/guide-demo/components/DemoGuideApp'
import { DemoMapView } from '@/features/guide-demo/components/DemoMapView'

function openFavorites() {
  render(<DemoGuideApp />)
  fireEvent.click(screen.getByRole('button', { name: 'Coups de cœur' }))
}

describe('045-public-demo-private-guide-reference discovery views', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/concept')
  })

  it('renders and filters the local favorite bento, then restores favorites from a POI', () => {
    openFavorites()

    expect(
      screen.getByRole('heading', { name: 'Nos coups de cœur' }),
    ).toBeInTheDocument()
    const filterBar = screen.getByRole('group', {
      name: 'Filtrer les catégories',
    })
    expect(within(filterBar).getByRole('button', { name: 'Tous' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    const grid = screen.getByTestId('favorites-bento-grid')
    const cards = within(grid).getAllByTestId('favorite-bento-card')
    expect(cards).toHaveLength(14)
    expect(cards[0]).toHaveClass('col-span-2', 'aspect-square')
    expect(cards[0]).toHaveAttribute('data-variant', 'big')
    for (const card of cards.slice(1)) {
      expect(card).toHaveClass('aspect-square')
      expect(card).not.toHaveClass('col-span-2')
      expect(card).toHaveAttribute('data-variant', 'compact')
      expect(card.querySelector('img')).not.toBeNull()
    }

    fireEvent.click(
      within(filterBar).getByRole('button', { name: 'Restaurants' }),
    )
    expect(
      within(filterBar).getByRole('button', { name: 'Restaurants' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(within(grid).getAllByTestId('favorite-bento-card')).toHaveLength(3)
    expect(within(grid).getByText('Rond de Carotte')).toBeInTheDocument()

    fireEvent.click(
      within(grid).getByRole('button', { name: 'Ouvrir Rond de Carotte' }),
    )
    expect(
      screen.getByRole('heading', { name: 'Rond de Carotte' }),
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Retour aux coups de cœur' }),
    )
    expect(screen.getByTestId('favorites-bento-grid')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/concept')
    expect(screen.getByTestId('autonomous-demo-guide').querySelectorAll('a')).toHaveLength(0)
  })

  it('shows the public POI content while keeping effectful controls disabled', () => {
    openFavorites()
    fireEvent.click(
      screen.getByRole('button', { name: 'Ouvrir Rond de Carotte' }),
    )

    expect(screen.getByTestId('poi-detail-rating')).toHaveTextContent('4.8')
    expect(screen.getByTestId('poi-detail-rating-count')).toHaveTextContent(
      '367 avis',
    )
    expect(screen.getByTestId('poi-detail-distance')).toHaveTextContent(
      /du logement/,
    )
    expect(
      screen.getByTestId('owner-recommendation-note-text'),
    ).toHaveTextContent(/Une belle adresse du coin/i)
    expect(screen.getByText('Dimanche')).toBeInTheDocument()
    expect(screen.getByTestId('photo-attribution')).toHaveTextContent(
      'www.ronddecarotte.com',
    )
    expect(screen.getByRole('button', { name: 'Voir sur la carte' })).toBeEnabled()
    for (const label of ['Obtenir l’itinéraire', 'Site web', 'Appeler']) {
      expect(screen.getByRole('button', { name: label })).toBeDisabled()
    }
  })

  it('shows the local Porcherey trail preview without starting GPS tracking', () => {
    const geolocation = { getCurrentPosition: jest.fn() }
    Object.defineProperty(window.navigator, 'geolocation', {
      configurable: true,
      value: geolocation,
    })

    openFavorites()
    fireEvent.click(
      screen.getByRole('button', { name: 'Ouvrir L’Alpage de Porcherey' }),
    )

    expect(screen.getByText('8,3 km')).toBeInTheDocument()
    expect(screen.getByText('709 m')).toBeInTheDocument()
    expect(screen.getAllByText('3 h 30')).not.toHaveLength(0)
    expect(screen.getByText('Facile')).toBeInTheDocument()
    expect(screen.getByText('Saint-Nicolas de Véroce')).toBeInTheDocument()
    expect(
      screen.getByRole('img', {
        name: 'Aperçu de la randonnée L’Alpage de Porcherey',
      }),
    ).toBeInTheDocument()
    const start = screen.getByRole('button', { name: 'Commencer la randonnée' })
    expect(start).toBeDisabled()
    expect(start).toHaveAttribute('aria-disabled', 'true')
    expect(
      screen.getByText('Suivi GPS indisponible dans le guide de démonstration.'),
    ).toBeInTheDocument()
    const attribution = screen.getByTestId('photo-attribution')
    const trailHeading = screen.getByRole('heading', {
      name: 'Informations du parcours',
    })
    const mapButton = screen.getByRole('button', { name: 'Voir sur la carte' })
    expect(
      attribution.compareDocumentPosition(trailHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      trailHeading.compareDocumentPosition(mapButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(geolocation.getCurrentPosition).not.toHaveBeenCalled()
    expect(window.location.pathname).toBe('/concept')
  })

  it('replaces failed public images with the local category fallback', () => {
    openFavorites()
    const favoriteImage = screen
      .getAllByTestId('favorite-bento-card')[0]
      .querySelector('img') as HTMLImageElement
    fireEvent.error(favoriteImage)
    expect(favoriteImage.getAttribute('src')).toBe('/fallback/fallback-restaurant.png')

    fireEvent.click(
      screen.getByRole('button', { name: 'Ouvrir Rond de Carotte' }),
    )
    const detailImage = screen
      .getByRole('heading', { name: 'Rond de Carotte' })
      .closest('article')
      ?.querySelector('img') as HTMLImageElement
    fireEvent.error(detailImage)
    expect(detailImage.getAttribute('src')).toBe('/fallback/fallback-restaurant.png')
  })

  it('renders static map markers without geolocation and restores map from the detail view', () => {
    const geolocation = { getCurrentPosition: jest.fn() }
    Object.defineProperty(window.navigator, 'geolocation', {
      configurable: true,
      value: geolocation,
    })

    render(<DemoGuideApp />)
    fireEvent.click(screen.getByRole('button', { name: 'Carte' }))

    expect(
      screen.getByRole('heading', { name: 'Carte des coups de cœur' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Carte de démonstration · position GPS désactivée'),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: / sur la carte$/ })).toHaveLength(
      14,
    )
    expect(geolocation.getCurrentPosition).not.toHaveBeenCalled()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Afficher Rond de Carotte sur la carte',
      }),
    )
    expect(
      screen.getByRole('button', { name: 'Voir la fiche Rond de Carotte' }),
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Voir la fiche Rond de Carotte' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Retour à la carte' }))
    expect(
      screen.getByRole('button', { name: 'Voir la fiche Rond de Carotte' }),
    ).toBeInTheDocument()
  })

  it('selects a POI on the static map from the favorites action', () => {
    openFavorites()
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Afficher Rond de Carotte sur la carte',
      }),
    )

    expect(
      screen.getByRole('heading', { name: 'Carte des coups de cœur' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Voir la fiche Rond de Carotte' }),
    ).toBeInTheDocument()
  })

  it('opens the selected static-map preview from the POI detail action', () => {
    openFavorites()
    fireEvent.click(
      screen.getByRole('button', { name: 'Ouvrir Rond de Carotte' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Voir sur la carte' }))

    expect(
      screen.getByRole('heading', { name: 'Carte des coups de cœur' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Voir la fiche Rond de Carotte' }),
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe('/concept')
  })

  it('keeps a useful local fallback when the static map has no POIs', () => {
    render(
      <DemoMapView
        pois={[]}
        selectedPoi={null}
        onDeselectPoi={jest.fn()}
        onOpenPoi={jest.fn()}
        onSelectPoi={jest.fn()}
      />,
    )

    expect(
      screen.getByText('Aucun coup de cœur à afficher sur cette carte.'),
    ).toBeInTheDocument()
  })
})
