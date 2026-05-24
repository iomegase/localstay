/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { PoiCard } from '@/features/categories/components/PoiCard'
import type { PoiCard as PoiCardType } from '@/features/categories/types'

const poi: PoiCardType = {
  id: '1',
  name: 'Le Bistrot du Mont-Blanc',
  slug: 'restaurants-gastro-demo',
  address: 'Place du Mont-Blanc, 74170 Saint-Gervais-les-Bains',
  subcategory_name: 'Gastronomique',
  rating: 4.5,
  rating_count: 120,
  is_open_now: true,
  distance_km: 1.234,
  photo_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
  latitude: 45.89,
  longitude: 6.71,
}

describe('PoiCard — AC-01-02 (all required fields rendered)', () => {
  beforeEach(() => {
    render(<PoiCard poi={poi} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
  })

  it('renders the POI name', () => {
    expect(screen.getByText('Le Bistrot du Mont-Blanc')).toBeInTheDocument()
  })

  it('renders the subcategory name', () => {
    expect(screen.getByText('Gastronomique')).toBeInTheDocument()
  })

  it('renders the address', () => {
    expect(screen.getByText('Place du Mont-Blanc, 74170 Saint-Gervais-les-Bains')).toBeInTheDocument()
  })

  it('renders the rating', () => {
    expect(screen.getByTestId('poi-rating')).toHaveTextContent('4.5')
  })

  it('renders the distance in km', () => {
    expect(screen.getByTestId('poi-distance')).toHaveTextContent('1.2 km')
  })

  it('renders the photo as an img', () => {
    const img = screen.getByRole('img', { name: 'Le Bistrot du Mont-Blanc' })
    expect(img).toHaveAttribute('src', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400')
  })

  it('AC-02-02: renders the owner note when the POI is featured for a lodging', () => {
    render(
      <PoiCard
        poi={{ ...poi, owner_note: 'Notre table préférée après une randonnée.' }}
        citySlug="saint-gervais-les-bains"
        categorySlug="restaurants"
      />,
    )
    expect(screen.getByText('Notre table préférée après une randonnée.')).toBeInTheDocument()
  })

  it('links to /guide/[city]/[category]/[slug]', () => {
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/guide/saint-gervais-les-bains/restaurants/restaurants-gastro-demo')
  })

  it('renders distance in metres when < 1 km', () => {
    render(<PoiCard poi={{ ...poi, distance_km: 0.35 }} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
    const distanceEls = screen.getAllByTestId('poi-distance')
    expect(distanceEls[distanceEls.length - 1]).toHaveTextContent('350 m')
  })
})
