/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { GuideFavoritesPage } from '@/features/guide-app/components/GuideFavoritesPage'
import { buildStayPoi } from '../support/guide-stay-lodging'

const pois = [
  buildStayPoi({ id: 'p1', name: 'Le Bettex', latitude: 45.8915, longitude: 6.7115 }),
  buildStayPoi({
    id: 'p2', name: 'Lulu', description: 'Pâtisserie maison', latitude: 45.9, longitude: 6.71,
    category: { slug: 'cafes', name: 'Cafés', icon: 'coffee', color: '#000' },
  }),
]

function renderPage(origin: { latitude: number; longitude: number } | null = null) {
  render(
    <GuideFavoritesPage
      pois={pois}
      city="Saint-Gervais-les-Bains"
      origin={origin}
      selectedCategorySlug={null}
      onFilter={jest.fn()}
      onSelectPoi={jest.fn()}
      onShowOnMap={jest.fn()}
    />,
  )
}

describe('056 guide tab', () => {
  it('AC-01-01: shows the guide header, search field and keeps the photo grid', () => {
    renderPage()
    expect(screen.getByText('Le guide')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Saint-Gervais' })).toBeInTheDocument()
    expect(screen.getByText('Nos coups de cœur pour profiter de votre séjour')).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Rechercher un lieu' })).toBeInTheDocument()
    expect(screen.getAllByTestId('favorite-bento-card')).toHaveLength(2)
  })

  it('AC-01-02/03: filters the grid and shows an empty state that can be cleared', () => {
    renderPage()
    const search = screen.getByRole('searchbox', { name: 'Rechercher un lieu' })

    fireEvent.change(search, { target: { value: 'patisserie' } })
    expect(screen.getAllByTestId('favorite-bento-card')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Ouvrir Lulu' })).toBeInTheDocument()

    fireEvent.change(search, { target: { value: 'piscine' } })
    expect(screen.queryByTestId('favorite-bento-card')).not.toBeInTheDocument()
    expect(screen.getByText('Aucun lieu ne correspond à « piscine ».')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Effacer' }))
    expect(screen.getAllByTestId('favorite-bento-card')).toHaveLength(2)
  })

  it('AC-01-04: shows crow-fly distances only for a precisely located lodging', () => {
    renderPage({ latitude: 45.8915, longitude: 6.7085 })
    // Amendement 057 du 2026-10-04 : la mention de source n'est plus affichée.
    expect(screen.queryByText(/vol d'oiseau/)).not.toBeInTheDocument()
    const cards = screen.getAllByTestId('favorite-bento-card')
    expect(within(cards[0]).getByText('230 m')).toBeInTheDocument()
  })

  it('AC-01-04: shows no distance without precise coordinates', () => {
    renderPage(null)
    expect(screen.queryByText("Distances à vol d'oiseau depuis le logement")).not.toBeInTheDocument()
    expect(screen.queryByText(/\d+ m$/)).not.toBeInTheDocument()
  })
})
