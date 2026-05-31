/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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
  photos: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400'],
  phone: '+33450000000',
  description: 'Une table gastronomique au pied du Mont-Blanc.',
  closes_at_label: '20h',
  latitude: 45.89,
  longitude: 6.71,
}

describe('PoiCard — AC-01-02 (SpaCard redesign)', () => {
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

  it('renders the distance in km', () => {
    expect(screen.getByTestId('poi-distance')).toHaveTextContent('1.2 km')
  })

  it('renders the photo as an img', () => {
    const img = screen.getByRole('img', { name: 'Le Bistrot du Mont-Blanc' })
    expect(img).toHaveAttribute('src', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400')
  })

  it('renders the APPELER button as a tel: link when a phone is set', () => {
    expect(screen.getByText('APPELER').closest('a')).toHaveAttribute('href', 'tel:+33450000000')
  })

  it('shows the closing time when available', () => {
    expect(screen.getByText('20h')).toBeInTheDocument()
  })
})

describe('PoiCard — accordion behaviour', () => {
  it('reveals the description only after expanding', () => {
    render(
      <PoiCard
        poi={{ ...poi, owner_note: 'Notre table préférée après une randonnée.' }}
        citySlug="saint-gervais-les-bains"
        categorySlug="restaurants"
      />,
    )
    expect(screen.queryByText('Notre table préférée après une randonnée.')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Le Bistrot du Mont-Blanc'))
    expect(screen.getByText('Notre table préférée après une randonnée.')).toBeInTheDocument()
  })

  it('renders distance in metres when < 1 km', () => {
    render(<PoiCard poi={{ ...poi, distance_km: 0.35 }} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
    const distanceEls = screen.getAllByTestId('poi-distance')
    expect(distanceEls[distanceEls.length - 1]).toHaveTextContent('350 m')
  })

  it('hides the APPELER button when no phone is set', () => {
    render(<PoiCard poi={{ ...poi, phone: null }} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
    expect(screen.queryByText('APPELER')).not.toBeInTheDocument()
  })
})

describe('PoiCard — randonnée variant', () => {
  const trailPoi: PoiCardType = {
    ...poi,
    name: 'Lac de Pormenaz',
    slug: 'lac-de-pormenaz',
    phone: null,
    is_open_now: null,
    closes_at_label: null,
    trail_detail: {
      difficulty: 'medium',
      estimated_duration_min: 210,
      distance_km: 8.4,
      elevation_gain_m: 950,
    },
  }

  it('shows trail stats (duration, distance, elevation) instead of opening hours', () => {
    render(<PoiCard poi={trailPoi} citySlug="les-contamines-montjoie" categorySlug="rando" />)
    const stats = screen.getByTestId('trail-stats')
    expect(stats).toHaveTextContent('3h30')
    expect(stats).toHaveTextContent('8.4 km')
    expect(stats).toHaveTextContent('950 m')
  })

  it('shows the difficulty badge and no open/closed badge', () => {
    render(<PoiCard poi={trailPoi} citySlug="les-contamines-montjoie" categorySlug="rando" />)
    expect(screen.getByTestId('badge-difficulty')).toHaveTextContent('Modéré')
    expect(screen.queryByTestId('badge-closed')).not.toBeInTheDocument()
  })

  it('never shows the APPELER button for a trail', () => {
    render(
      <PoiCard
        poi={{ ...trailPoi, phone: '+33450000000' }}
        citySlug="les-contamines-montjoie"
        categorySlug="rando"
      />,
    )
    expect(screen.queryByText('APPELER')).not.toBeInTheDocument()
  })
})
