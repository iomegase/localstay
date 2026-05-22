/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { PoiDetailBody } from '@/features/categories/components/PoiDetailBody'
import type { PoiDetail } from '@/features/categories/types'

beforeAll(() => {
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'pk.test-token'
})

const poi: PoiDetail = {
  id: '1', name: 'Le Bistrot', slug: 'bistrot',
  description: 'Test', address: 'Place du Mont-Blanc',
  latitude: 45.8921, longitude: 6.7085,
  phone: null, website: null, rating: 4.2, rating_count: 80,
  is_open_now: true, hours: null,
  photos: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'],
  distance_km: 0.3,
  category: { id: 'c1', name: 'Restaurants', slug: 'restaurants', icon: 'utensils' },
  subcategory: null,
  hiking_detail: null,
}

describe('PoiDetailBody — AC-03-01 (MiniMap visible)', () => {
  it('renders the mini-map image', () => {
    render(<PoiDetailBody poi={poi} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
    expect(screen.getByTestId('mini-map')).toBeInTheDocument()
  })

  it('mini-map src contains POI coordinates', () => {
    render(<PoiDetailBody poi={poi} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
    const src = screen.getByTestId('mini-map').getAttribute('src') ?? ''
    expect(src).toContain('45.8921')
    expect(src).toContain('6.7085')
  })
})
