/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { GuideApp } from '@/features/guide-app/components/GuideApp'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'
import { demoPois } from '@/features/guide-demo/demo-pois'

function openFavorites() {
  render(<GuideApp mode="demo" lodging={demoLodging} pois={demoPois} />)
  fireEvent.click(screen.getByRole('button', { name: 'Coups de cœur' }))
}

describe('GuideApp favorites — bento hierarchy (AC-05-12)', () => {
  it('renders a two-column bento grid with a big first card and compact rest', () => {
    openFavorites()

    const grid = screen.getByTestId('favorites-bento-grid')
    expect(grid).toHaveClass('grid', 'grid-cols-2', 'gap-3')

    const cards = within(grid).getAllByTestId('favorite-bento-card')
    expect(cards).toHaveLength(demoPois.length)

    expect(cards[0]).toHaveClass('col-span-2', 'aspect-square')
    expect(cards[0]).toHaveAttribute('data-variant', 'big')
    for (const card of cards.slice(1)) {
      expect(card).toHaveClass('aspect-square')
      expect(card).not.toHaveClass('col-span-2')
      expect(card).toHaveAttribute('data-variant', 'compact')
    }
  })

  it('never renders a white/text-only card and always shows a full-frame image', () => {
    openFavorites()

    const grid = screen.getByTestId('favorites-bento-grid')
    const cards = within(grid).getAllByTestId('favorite-bento-card')

    // Chaque carte porte exactement une image plein cadre ; aucune variante blanche
    const images = grid.querySelectorAll('img')
    expect(images).toHaveLength(demoPois.length)
    for (const card of cards) {
      expect(card).not.toHaveClass('bg-white')
      expect(card.querySelector('img')).not.toBeNull()
    }
  })

  it('uses the administered hero when present and a category fallback otherwise', () => {
    openFavorites()

    const grid = screen.getByTestId('favorites-bento-grid')
    const images = Array.from(grid.querySelectorAll('img')) as HTMLImageElement[]

    // Aucune image vide ; au moins une hero réelle et au moins un fallback catégorie
    expect(images.every(img => (img.getAttribute('src') ?? '').length > 0)).toBe(true)
    expect(images.some(img => !(img.getAttribute('src') ?? '').startsWith('/fallback/'))).toBe(true)
    expect(images.some(img => (img.getAttribute('src') ?? '').startsWith('/fallback/'))).toBe(true)
  })

  it('exposes no private link inside the grid', () => {
    openFavorites()
    expect(screen.getByTestId('favorites-bento-grid').querySelector('a')).toBeNull()
  })

  it('opens the internal POI sheet from the primary action', () => {
    openFavorites()
    const grid = screen.getByTestId('favorites-bento-grid')

    fireEvent.click(within(grid).getAllByRole('button', { name: /^Ouvrir / })[0])
    expect(screen.queryByTestId('favorites-bento-grid')).not.toBeInTheDocument()
  })

  it('opens the internal map view from the distinct Carte action', () => {
    openFavorites()
    const grid = screen.getByTestId('favorites-bento-grid')

    fireEvent.click(within(grid).getAllByRole('button', { name: /sur la carte$/ })[0])
    expect(screen.queryByTestId('favorites-bento-grid')).not.toBeInTheDocument()
  })
})
