/** @jest-environment jsdom */

import React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  DemoGuideApp,
  getEditorialSelectionsForView,
} from '@/features/guide-demo/components/DemoGuideApp'
import {
  DemoBlogDetailView,
  DemoBlogView,
  DemoContactView,
  DemoLodgingDetailView,
  DemoLodgingsView,
} from '@/features/guide-demo/components/DemoEditorialViews'
import { DemoMapView } from '@/features/guide-demo/components/DemoMapView'
import { DemoPoiDetailView } from '@/features/guide-demo/components/DemoPoiDetailView'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'
import { demoGuideData } from '@/features/guide-demo/demo-content'
import { demoPois } from '@/features/guide-demo/demo-pois'

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
    expect(filterBar).toHaveClass(
      'sticky',
      'top-0',
      'z-20',
      'overflow-x-auto',
      'bg-white/95',
      'backdrop-blur-xl',
    )
    expect(within(filterBar).getByRole('button', { name: 'Tous' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    const grid = screen.getByTestId('favorites-bento-grid')
    const cards = within(grid).getAllByTestId('favorite-bento-card')
    expect(cards).toHaveLength(14)
    expect(cards[0]).toHaveClass(
      'col-span-2',
      'aspect-square',
      'rounded-[2rem]',
      'bg-charcoal',
    )
    expect(cards[0]).toHaveAttribute('data-variant', 'big')
    expect(within(cards[0]).getByRole('heading', { name: 'Rond de Carotte' })).toHaveClass(
      'font-semibold',
      'uppercase',
      'text-2xl',
    )
    expect(within(cards[0]).getByTestId('favorite-open-status')).toHaveTextContent(
      'Ouvert',
    )
    expect(
      within(cards[0]).getByRole('button', {
        name: 'Afficher Rond de Carotte sur la carte',
      }),
    ).toHaveClass('absolute', 'right-3', 'top-3', 'bg-black/55')
    for (const card of cards.slice(1)) {
      expect(card).toHaveClass('aspect-square', 'rounded-[1.75rem]', 'bg-charcoal')
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

  it('keeps POI detail fallbacks clean when optional rating metadata is absent', () => {
    openFavorites()

    fireEvent.click(
      screen.getByRole('button', { name: 'Ouvrir Piscine de Saint-Gervais' }),
    )

    expect(
      screen.getByRole('heading', { name: 'Piscine de Saint-Gervais' }),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('poi-detail-rating-count')).not.toBeInTheDocument()
    expect(screen.getByTestId('photo-attribution')).toHaveTextContent(
      'www.saintgervais.com',
    )
    expect(screen.getByTestId('poi-detail-distance')).toHaveTextContent(
      /du logement/,
    )
    expect(screen.getByRole('button', { name: 'Voir sur la carte' })).toBeEnabled()
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
    expect(title).toHaveClass('font-semibold', 'uppercase', 'text-sm', 'leading-tight')
    expect(title.parentElement).toHaveClass('p-4')
    expect(within(compactCard).queryByText('4.4')).not.toBeInTheDocument()
    expect(open).toHaveClass('absolute', 'inset-0', 'h-full', 'w-full')
    expect(map).toHaveClass('absolute', 'right-3', 'top-3', 'p-2')
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
    const poiHeading = screen.getByRole('heading', { name: 'Rond de Carotte' })
    expect(poiHeading).toHaveClass('text-xl', 'uppercase', 'text-charcoal')
    expect(poiHeading).not.toHaveClass('font-serif', 'italic')
    expect(screen.getByTestId('poi-detail-distance')).toHaveClass(
      'inline-flex',
      'text-pink-600',
    )
    const actions = screen.getByTestId('demo-poi-actions')
    expect(actions).toHaveClass('grid-cols-2')
    expect(
      within(actions).getByRole('button', { name: 'Voir sur la carte' }),
    ).toHaveClass('rounded-full', 'bg-white', 'uppercase')
    expect(
      within(actions).getByTestId('demo-poi-action-icon-map'),
    ).toHaveClass('rounded-full', 'bg-slate-900', 'text-white')
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

  it('renders the private-style map without geolocation and restores it from the detail view', () => {
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
    expect(screen.getByTestId('mapbox-map')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Sélectionner / })).toHaveLength(
      14,
    )
    expect(geolocation.getCurrentPosition).not.toHaveBeenCalled()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Sélectionner Rond de Carotte',
      }),
    )
    const preview = screen.getByTestId('demo-map-preview')
    expect(preview).toHaveFocus()
    expect(preview).not.toHaveClass('fixed')
    expect(preview).toHaveAttribute('role', 'region')
    fireEvent.click(
      screen.getByRole('button', { name: 'Ouvrir la fiche Rond de Carotte' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Retour à la carte' }))
    expect(
      screen.getByRole('button', { name: 'Ouvrir la fiche Rond de Carotte' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('demo-map-preview')).toHaveFocus()
  })

  it('uses the local fallback if a selected map-preview image fails', () => {
    render(<DemoGuideApp />)
    fireEvent.click(screen.getByRole('button', { name: 'Carte' }))
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Sélectionner Rond de Carotte',
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
      name: 'Sélectionner Rond de Carotte',
    })

    await user.click(marker)
    expect(screen.getByTestId('demo-map-preview')).toHaveFocus()
    await user.click(screen.getByTestId('mapbox-map'))

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
      name: 'Sélectionner Rond de Carotte',
    })

    await user.click(screen.getByTestId('mapbox-map'))

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
      screen.getByRole('button', { name: 'Ouvrir la fiche Rond de Carotte' }),
    ).toBeInTheDocument()
  })

  it('opens and frames the complete route from the POI detail map action', () => {
    openFavorites()
    fireEvent.click(
      screen.getByRole('button', { name: 'Ouvrir Rond de Carotte' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Voir sur la carte' }))

    expect(
      screen.getByRole('heading', { name: 'Carte des coups de cœur' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('mapbox-source')).toBeInTheDocument()
    expect(screen.getByTestId('guide-map')).toHaveAttribute(
      'data-route-focused',
      'true',
    )
    expect(screen.queryByTestId('demo-map-preview')).not.toBeInTheDocument()
    expect(window.location.pathname).toBe('/concept')
  })

  it('keeps a useful local fallback when the static map has no POIs', () => {
    render(
      <DemoMapView
        lodging={demoLodging}
        pois={[]}
        selectedPoi={null}
        focusSelectedRoute={false}
        selectedCategorySlug={null}
        onFilter={jest.fn()}
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

    const lodgingsHeading = screen.getByRole('heading', {
      name: 'Des lieux suivis avec attention.',
    })
    await waitFor(() => expect(lodgingsHeading).toHaveFocus())
    const lodgingButton = screen.getByRole('button', {
      name: 'Voir Chalet des Cimes — démonstration',
    })
    expect(lodgingButton).toBeEnabled()
    fireEvent.click(lodgingButton)

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Chalet des Cimes — démonstration', level: 1 }),
      ).toHaveFocus(),
    )
    expect(
      screen.getByRole('button', { name: 'Tous les logements' }),
    ).toBeInTheDocument()
    const lodgingGallery = screen.getByRole('region', {
        name: 'Photos de Chalet des Cimes — démonstration',
      })
    expect(lodgingGallery).toHaveClass('grid-cols-2', 'grid-rows-[2fr_1fr]')
    expect(lodgingGallery).not.toHaveClass('md:grid-cols-[1.7fr_0.85fr]')
    const essentials = screen.getByTestId('lodging-essentials')
    expect(essentials.querySelector('dl')).toHaveClass('grid-cols-2')
    expect(essentials.querySelector('dl')).not.toHaveClass('md:grid-cols-5')
    expect(screen.getByText('Le logement')).toBeInTheDocument()
    expect(screen.getByText('Votre séjour')).toBeInTheDocument()
    expect(screen.getByTestId('lodging-feature-sections')).not.toHaveClass('md:grid-cols-2')
    expect(screen.getByText('Équipements')).toBeInTheDocument()
    expect(screen.getByText('Services sur demande')).toBeInTheDocument()
    expect(screen.getByText('Cuisine équipée')).toBeInTheDocument()
    expect(screen.getByText('En images')).toBeInTheDocument()
    expect(screen.getByText('Pièce de vie')).toBeInTheDocument()
    const roomGrid = screen.getByText('En images').closest('section')?.querySelector('.grid')
    expect(roomGrid).toHaveClass('grid-cols-2')
    expect(roomGrid).not.toHaveClass('sm:grid-cols-3', 'lg:grid-cols-5')
    expect(screen.getAllByText('Secteur fictif des hauteurs')).not.toHaveLength(0)
    const lodgingDetailArticle = screen
      .getByRole('heading', { name: 'Chalet des Cimes — démonstration', level: 1 })
      .closest('article')
    if (!lodgingDetailArticle) {
      throw new Error('Lodging detail article is required')
    }
    const lodgingDetailImage = within(lodgingDetailArticle).getAllByRole('img', {
      name: 'Salon fictif du Chalet des Cimes',
    })[0] as HTMLImageElement
    expect(lodgingDetailImage.getAttribute('src')).toBe(
      '/marketing/demo-lodging-2.webp',
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Tous les logements' }),
    )
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {
          name: 'Des lieux suivis avec attention.',
        }),
      ).toHaveFocus(),
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

  it('renders injected published lodging and blog content instead of local fixtures', () => {
    const lodging = {
      ...demoGuideData.lodgingCards[0],
      id: 'demo-lodging-real-chalet' as const,
      slug: 'demo-real-chalet' as const,
      title: 'Le vrai chalet publié',
      description: 'Description publique du vrai chalet.',
    }
    const post = {
      ...demoGuideData.blogPosts[0],
      id: 'demo-blog-real-article' as const,
      slug: 'demo-real-article' as const,
      title: 'Le véritable article publié',
      contentMarkdown: '## Contenu public\n\nTexte public réel.',
    }

    render(
      <DemoGuideApp
        publishedContent={{ lodgingCards: [lodging], blogPosts: [post] }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Nos logements' }))
    expect(
      screen.getByRole('button', { name: 'Voir Le vrai chalet publié' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Chalet des Cimes — démonstration'),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Blog' }))
    expect(
      screen.getByRole('button', { name: 'Lire Le véritable article publié' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Un week-end de démonstration à Saint-Gervais'),
    ).not.toBeInTheDocument()
  })

  it('uses the MyStay sans-serif typography for every editorial heading', () => {
    const assertSansSerifHeading = (name: string) => {
      for (const heading of screen.getAllByRole('heading', { name })) {
        expect(heading).not.toHaveClass('font-serif', 'italic')
      }
    }

    const { rerender } = render(
      <DemoLodgingsView
        lodgings={demoGuideData.lodgingCards}
        onOpenLodging={jest.fn()}
      />,
    )
    assertSansSerifHeading('Des lieux suivis avec attention.')

    rerender(
      <DemoLodgingDetailView
        lodging={demoGuideData.lodgingCards[0]}
        onBack={jest.fn()}
      />,
    )
    assertSansSerifHeading('Chalet des Cimes — démonstration')

    rerender(
      <DemoBlogView posts={demoGuideData.blogPosts} onOpenPost={jest.fn()} />,
    )
    assertSansSerifHeading('Blog')

    rerender(
      <DemoBlogDetailView
        post={demoGuideData.blogPosts[0]}
        onBack={jest.fn()}
      />,
    )
    assertSansSerifHeading('Un week-end de démonstration à Saint-Gervais')

    rerender(<DemoContactView contact={demoGuideData.contact} />)
    assertSansSerifHeading('Votre hôte')
  })

  it('keeps useful local empty states for lodging and blog collections', () => {
    const { rerender } = render(
      <DemoLodgingsView lodgings={[]} onOpenLodging={jest.fn()} />,
    )

    expect(
      screen.getByText('Aucun logement public n’est disponible pour le moment.'),
    ).toBeInTheDocument()

    rerender(<DemoBlogView posts={[]} onOpenPost={jest.fn()} />)

    expect(
      screen.getByText('Aucun article public n’est disponible pour le moment.'),
    ).toBeInTheDocument()
  })

  it('uses each lodging and blog card as its single native interactive control', () => {
    render(<DemoGuideApp />)

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Nos logements' }))
    expect(
      screen.getByRole('heading', { name: 'Des lieux suivis avec attention.' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Chaque logement est accompagné par notre conciergerie et dispose de son propre guide d’arrivée MyStay.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('2 logements')).toBeInTheDocument()
    expect(screen.getByText('Filtrer')).toBeInTheDocument()
    const lodgingCard = screen.getAllByTestId('demo-lodging-card')[0]
    expect(lodgingCard.tagName).toBe('BUTTON')
    expect(lodgingCard).toHaveAccessibleName('Voir Chalet des Cimes — démonstration')
    expect(lodgingCard.querySelector('img')).not.toBeNull()
    expect(lodgingCard.querySelectorAll('button')).toHaveLength(0)
    expect(lodgingCard.querySelectorAll('a')).toHaveLength(0)
    expect(within(lodgingCard).getByText('Surface')).toBeInTheDocument()
    expect(within(lodgingCard).getByText('Voyageurs')).toBeInTheDocument()
    expect(within(lodgingCard).getByText('Chambres')).toBeInTheDocument()
    expect(within(lodgingCard).getByText('Salles de bain')).toBeInTheDocument()
    expect(within(lodgingCard).queryByText('Voir Chalet des Cimes — démonstration')).not.toBeInTheDocument()

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
