/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { FavoritesList } from '@/features/public-menu/components/FavoritesList'
import type { FavoritePoi } from '@/features/public-menu/lib/favorites'

jest.mock('@/features/public-menu/lib/favorites', () => ({
  readFavorites: () => [
    {
      poi_id: 'poi-1',
      name: 'Le Boudoir Family Store',
      city_slug: 'saint-gervais-les-bains',
      category_slug: 'shopping',
      poi_slug: 'le-boudoir-family-store',
      photo: 'https://example.com/boudoir.jpg',
      added_at: '2026-06-01T08:00:00.000Z',
    },
  ],
  subscribeToFavorites: () => () => {},
  removeFavorite: jest.fn(),
}))

// On isole le comportement de la liste : le contenu de la fiche (PoiDetailBody → react-markdown,
// ESM) est remplacé par un stub identifiable.
jest.mock('@/features/public-menu/components/FavoritePoiModal', () => ({
  FavoritePoiModal: ({ fav, onClose }: { fav: FavoritePoi; onClose: () => void }) => (
    <div data-testid="favorite-poi-modal">
      {fav.poi_slug}
      <button onClick={onClose}>fermer-stub</button>
    </div>
  ),
}))

describe('FavoritesList — ouverture en modal', () => {
  it('renders favorites as compact vertical POI-style cards without accordion', () => {
    render(<FavoritesList />)

    const card = screen.getByTestId('favorite-card-poi-1')
    expect(card).toHaveClass('overflow-hidden')
    expect(card).toHaveClass('bg-white')
    expect(card).not.toHaveAttribute('aria-expanded')

    const hero = screen.getByTestId('favorite-card-hero-poi-1')
    expect(hero).toHaveClass('h-[220px]')
    expect(screen.getByRole('img', { name: 'Le Boudoir Family Store' })).toHaveClass('object-cover')
    expect(screen.getByTestId('favorite-card-category-poi-1')).toHaveTextContent('shopping')
    expect(screen.getByRole('button', { name: 'Ouvrir Le Boudoir Family Store' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retirer Le Boudoir Family Store des favoris' })).toBeInTheDocument()
    expect(screen.queryByText(/en savoir plus/i)).not.toBeInTheDocument()
  })

  it('opens the POI in a modal on click instead of navigating to a detail page', () => {
    render(<FavoritesList />)

    // Pas de lien vers la page détail : on n'expose plus d'URL /guide/.../slug
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByTestId('favorite-poi-modal')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Le Boudoir Family Store'))

    const modal = screen.getByTestId('favorite-poi-modal')
    expect(modal).toHaveTextContent('le-boudoir-family-store')
  })

  it('closes the modal via its close callback', () => {
    render(<FavoritesList />)
    fireEvent.click(screen.getByText('Le Boudoir Family Store'))
    expect(screen.getByTestId('favorite-poi-modal')).toBeInTheDocument()

    fireEvent.click(screen.getByText('fermer-stub'))
    expect(screen.queryByTestId('favorite-poi-modal')).not.toBeInTheDocument()
  })
})
