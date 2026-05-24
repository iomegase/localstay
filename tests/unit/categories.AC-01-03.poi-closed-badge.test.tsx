/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { PoiCard } from '@/features/categories/components/PoiCard'
import type { PoiCard as PoiCardType } from '@/features/categories/types'

const basePoi: PoiCardType = {
  id: '1',
  name: 'Le Bistrot du Mont-Blanc',
  slug: 'restaurants-gastro-demo',
  address: 'Place du Mont-Blanc, 74170 Saint-Gervais-les-Bains',
  subcategory_name: 'Gastronomique',
  rating: 4.5,
  rating_count: 120,
  is_open_now: true,
  distance_km: 0.3,
  photo_url: null,
  latitude: 45.89,
  longitude: 6.71,
}

describe('PoiCard — AC-01-03 (Fermé badge)', () => {
  it('does NOT show Fermé badge when is_open_now is true', () => {
    render(<PoiCard poi={{ ...basePoi, is_open_now: true }} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
    expect(screen.queryByTestId('badge-closed')).not.toBeInTheDocument()
  })

  it('shows Fermé badge when is_open_now is false', () => {
    render(<PoiCard poi={{ ...basePoi, is_open_now: false }} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
    expect(screen.getByTestId('badge-closed')).toBeInTheDocument()
    expect(screen.getByTestId('badge-closed')).toHaveTextContent('Fermé')
  })

  it('does NOT show Fermé badge when is_open_now is null (unknown)', () => {
    render(<PoiCard poi={{ ...basePoi, is_open_now: null }} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
    expect(screen.queryByTestId('badge-closed')).not.toBeInTheDocument()
  })
})
