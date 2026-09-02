/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  DemoGuideApp,
  getEditorialSelectionsForView,
} from '@/features/guide-demo/components/DemoGuideApp'
import {
  DemoBlogView,
  DemoLodgingsView,
} from '@/features/guide-demo/components/DemoEditorialViews'
import { DemoMapView } from '@/features/guide-demo/components/DemoMapView'
import { DemoPoiDetailView } from '@/features/guide-demo/components/DemoPoiDetailView'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'
import { demoGuideData } from '@/features/guide-demo/demo-content'
import { demoPois } from '@/features/guide-demo/demo-pois'

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
    const poiHeading = screen.getByRole('heading', { name: 'Rond de Carotte' })
    expect(poiHeading).toHaveFocus()
    fireEvent.click(
      screen.getByRole('button', { name: 'Retour aux coups de cœur' }),
    )
    const restoredFilterBar = screen.getByRole('group', {
      name: 'Filtrer les catégories',
    })
    const restoredGrid = screen.getByTestId('favorites-bento-grid')
    expect(
      within(restoredFilterBar).getByRole('button', { name: 'Restaurants' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(within(restoredGrid).getAllByTestId('favorite-bento-card')).toHaveLength(3)
    expect(
      screen.getByRole('heading', { name: 'Nos coups de cœur' }),
    ).toHaveFocus()
    expect(window.location.pathname).toBe('/concept')
    expect(screen.getByTestId('autonomous-demo-guide').querySelectorAll('a')).toHaveLength(0)
  })

  it('keeps compact bento cards usable without long visual controls', () => {
    openFavorites()
    const compactCard = screen
      .getByText('Bistrotsérac')
      .closest('article') as HTMLElement

    expect(compactCard).toHaveAttribute('data-variant', 'compact')
    expect(
      within(compactCard).queryByText('Cuisine à la braise sur la place du village.'),
    ).not.toBeInTheDocument()
    const open = within(compactCard).getByRole('button', {
      name: 'Ouvrir Bistrotsérac',
    })
    const map = within(compactCard).getByRole('button', {
      name: 'Afficher Bistrotsérac sur la carte',
    })
    const title = within(compactCard).getByRole('heading', {
      name: 'Bistrotsérac',
    })
    expect(title).toHaveClass('line-clamp-1', 'text-base')
    expect(title.parentElement).toHaveClass('p-2')
    expect(within(compactCard).queryByText('4.4')).not.toBeInTheDocument()
    expect(open).toHaveClass('h-7', 'w-7')
    expect(map).toHaveClass('h-7', 'w-7')
    expect(open).toHaveTextContent('')
    expect(map).toHaveTextContent('')
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
    ).toHaveFocus()
    expect(screen.queryByRole('heading', { name: 'Carte' })).not.toBeInTheDocument()
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
    const preview = screen.getByTestId('demo-map-preview')
    expect(preview).toHaveFocus()
    expect(preview).not.toHaveClass('fixed')
    expect(preview).toHaveAttribute('role', 'region')
    fireEvent.click(
      screen.getByRole('button', { name: 'Voir la fiche Rond de Carotte' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Retour à la carte' }))
    expect(
      screen.getByRole('button', { name: 'Voir la fiche Rond de Carotte' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('demo-map-preview')).toHaveFocus()
  })

  it('uses the local fallback if a selected map-preview image fails', () => {
    render(<DemoGuideApp />)
    fireEvent.click(screen.getByRole('button', { name: 'Carte' }))
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Afficher Rond de Carotte sur la carte',
      }),
    )

    const previewImage = screen
      .getByTestId('demo-map-preview')
      .querySelector('img') as HTMLImageElement
    fireEvent.error(previewImage)
    expect(previewImage.getAttribute('src')).toBe('/fallback/fallback-restaurant.png')
  })

  it('restores marker focus after closing a marker-selected preview', async () => {
    const user = userEvent.setup()
    render(<DemoGuideApp />)
    await user.click(screen.getByRole('button', { name: 'Carte' }))
    const marker = screen.getByRole('button', {
      name: 'Afficher Rond de Carotte sur la carte',
    })

    await user.click(marker)
    expect(screen.getByTestId('demo-map-preview')).toHaveFocus()
    await user.click(
      screen.getByRole('button', {
        name: 'Fermer l’aperçu de Rond de Carotte',
      }),
    )

    await waitFor(() => {
      expect(screen.queryByTestId('demo-map-preview')).not.toBeInTheDocument()
      expect(marker).toHaveFocus()
    })
  })

  it('restores marker focus after closing a favorites-selected preview', async () => {
    const user = userEvent.setup()
    render(<DemoGuideApp />)
    await user.click(screen.getByRole('button', { name: 'Coups de cœur' }))
    await user.click(
      screen.getByRole('button', {
        name: 'Afficher Rond de Carotte sur la carte',
      }),
    )
    const marker = screen.getByRole('button', {
      name: 'Afficher Rond de Carotte sur la carte',
    })

    await user.click(
      screen.getByRole('button', {
        name: 'Fermer l’aperçu de Rond de Carotte',
      }),
    )

    await waitFor(() => {
      expect(marker).toHaveFocus()
    })
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

  it('announces focused local view transitions without disrupting the guide URL', async () => {
    const user = userEvent.setup()
    render(<DemoGuideApp />)

    await user.click(screen.getByRole('button', { name: 'Coups de cœur' }))
    expect(
      screen.getByRole('heading', { name: 'Nos coups de cœur' }),
    ).toHaveFocus()
    await user.click(
      screen.getByRole('button', { name: 'Afficher Rond de Carotte sur la carte' }),
    )
    expect(screen.getByTestId('demo-map-preview')).toHaveFocus()
    expect(window.location.pathname).toBe('/concept')
  })

  it('renders unavailable trail metrics without an empty geometry preview', () => {
    const porcherey = demoPois.find(poi => poi.slug === 'alpage-de-porcherey')
    if (!porcherey?.trail) throw new Error('Porcherey trail fixture is required')

    render(
      <DemoPoiDetailView
        lodging={demoLodging}
        poi={{
          ...porcherey,
          trail: {
            ...porcherey.trail,
            distanceKm: null,
            elevationGainM: null,
            estimatedDurationMinutes: null,
            geometry: { type: 'MultiLineString', coordinates: [] },
          },
        }}
        returnLabel="Retour aux coups de cœur"
        onBack={jest.fn()}
        onShowOnMap={jest.fn()}
      />,
    )

    expect(screen.getAllByText('Indisponible')).toHaveLength(3)
    expect(
      screen.queryByRole('img', {
        name: 'Aperçu de la randonnée L’Alpage de Porcherey',
      }),
    ).not.toBeInTheDocument()
  })

  it('renders autonomous lodging and blog content details, then returns to their parent views', async () => {
    render(<DemoGuideApp />)

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Nos logements' }))

    const lodgingsHeading = screen.getByRole('heading', { name: 'Nos logements' })
    await waitFor(() => expect(lodgingsHeading).toHaveFocus())
    const lodgingButton = screen.getByRole('button', {
      name: 'Voir Chalet des Cimes — démonstration',
    })
    expect(lodgingButton).toBeEnabled()
    fireEvent.click(lodgingButton)

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Chalet des Cimes — démonstration' }),
      ).toHaveFocus(),
    )
    expect(screen.getByText('Cuisine équipée')).toBeInTheDocument()
    expect(screen.getByText('Secteur fictif des hauteurs')).toBeInTheDocument()
    const lodgingDetailArticle = screen
      .getByRole('heading', { name: 'Chalet des Cimes — démonstration' })
      .closest('article')
    if (!lodgingDetailArticle) {
      throw new Error('Lodging detail article is required')
    }
    const lodgingDetailImage = within(lodgingDetailArticle).getByRole('img', {
      name: 'Salon fictif du Chalet des Cimes',
    }) as HTMLImageElement
    expect(lodgingDetailImage.getAttribute('src')).toBe(
      '/marketing/demo-lodging-2.webp',
    )
    fireEvent.error(lodgingDetailImage)
    expect(lodgingDetailImage.getAttribute('src')).toBe(
      '/marketing/demo-lodging-1.webp',
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Retour aux logements' }),
    )
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Nos logements' })).toHaveFocus(),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Blog' }))
    const blogHeading = screen.getByRole('heading', { name: 'Blog' })
    await waitFor(() => expect(blogHeading).toHaveFocus())
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Lire Un week-end de démonstration à Saint-Gervais',
      }),
    )
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          name: 'Un week-end de démonstration à Saint-Gervais',
        }),
      ).toHaveFocus(),
    )
    expect(screen.getByText('Une journée au village')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retour au blog' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Blog' })).toHaveFocus())

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Nous contacter' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Votre hôte' })).toHaveFocus())
    expect(screen.getByText('Camille, hôte fictif')).toBeInTheDocument()
    expect(screen.getByText('Le 305 — démonstration')).toBeInTheDocument()
    expect(screen.getByText('Saint-Gervais-les-Bains')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Envoyer un message' }),
    ).toBeDisabled()
    expect(screen.getByTestId('autonomous-demo-guide').querySelector('form')).toBeNull()
    expect(screen.getByTestId('autonomous-demo-guide').querySelectorAll('a')).toHaveLength(0)
    expect(window.location.pathname).toBe('/concept')
  })

  it('keeps useful local empty states for lodging and blog collections', () => {
    const { rerender } = render(
      <DemoLodgingsView lodgings={[]} onOpenLodging={jest.fn()} />,
    )

    expect(
      screen.getByText('Aucun logement de démonstration n’est disponible pour le moment.'),
    ).toBeInTheDocument()

    rerender(<DemoBlogView posts={[]} onOpenPost={jest.fn()} />)

    expect(
      screen.getByText('Aucun article de démonstration n’est disponible pour le moment.'),
    ).toBeInTheDocument()
  })

  it('uses each lodging and blog card as its single native interactive control', () => {
    render(<DemoGuideApp />)

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Nos logements' }))
    const lodgingCard = screen.getAllByTestId('demo-lodging-card')[0]
    expect(lodgingCard.tagName).toBe('BUTTON')
    expect(lodgingCard).toHaveAccessibleName('Voir Chalet des Cimes — démonstration')
    expect(lodgingCard.querySelector('img')).not.toBeNull()
    expect(lodgingCard.querySelectorAll('button')).toHaveLength(0)
    expect(lodgingCard.querySelectorAll('a')).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Blog' }))
    const blogCard = screen.getAllByTestId('demo-blog-card')[0]
    expect(blogCard.tagName).toBe('BUTTON')
    expect(blogCard).toHaveAccessibleName(
      'Lire Un week-end de démonstration à Saint-Gervais',
    )
    expect(blogCard.querySelector('img')).not.toBeNull()
    expect(blogCard.querySelectorAll('button')).toHaveLength(0)
    expect(blogCard.querySelectorAll('a')).toHaveLength(0)
  })

  it('clears editorial selections on every view outside their list and detail families', () => {
    const selections = {
      selectedLodging: demoGuideData.lodgingCards[0],
      selectedPost: demoGuideData.blogPosts[0],
    }

    expect(
      getEditorialSelectionsForView('lodging-detail', selections),
    ).toEqual({
      selectedLodging: selections.selectedLodging,
      selectedPost: null,
    })
    expect(getEditorialSelectionsForView('blog', selections)).toEqual({
      selectedLodging: null,
      selectedPost: selections.selectedPost,
    })
    expect(getEditorialSelectionsForView('home', selections)).toEqual({
      selectedLodging: null,
      selectedPost: null,
    })
  })
})
