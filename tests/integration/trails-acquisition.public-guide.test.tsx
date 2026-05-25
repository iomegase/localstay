/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { PoiDetailBody } from '@/features/categories/components/PoiDetailBody'
import type { PoiDetail } from '@/features/categories/types'

jest.mock('@/features/categories/components/MiniMap', () => ({
  MiniMap: () => <div data-testid="mini-map" />,
}))

const trailPoi: PoiDetail = {
  id: 'poi-1',
  name: 'Boucle des alpages',
  slug: 'boucle-des-alpages',
  description: 'Belle randonnée familiale.',
  address: 'Départ parking du Bettex',
  latitude: 45.891,
  longitude: 6.713,
  phone: null,
  website: null,
  rating: null,
  rating_count: 0,
  is_open_now: null,
  hours: null,
  photos: [],
  distance_km: 2.4,
  category: { id: 'cat-rando', name: 'Rando', slug: 'rando', icon: 'mountain' },
  subcategory: null,
  trail_detail: {
    difficulty: 'medium',
    estimated_duration_min: 150,
    distance_km: 7.5,
    elevation_gain_m: 420,
    start_label: 'Parking du Bettex',
    parking_info: null,
    kids_friendly: true,
    pets_friendly: null,
    best_season: ['summer'],
    gpx_url: null,
    data_quality_status: 'complete',
    primary_source_type: 'official_website',
    source_refs: [{ type: 'official_website', attribution: 'Office de tourisme', used_for: ['content'] }],
  },
  hiking_detail: null,
  merchant_offers: [],
}

describe('019 public guide trail detail', () => {
  it('AC-05-02: renders TrailDetail before legacy HikingDetail fallback', () => {
    render(<PoiDetailBody poi={trailPoi} citySlug="saint-gervais-les-bains" categorySlug="rando" />)

    expect(screen.getByTestId('trail-detail-block')).toBeInTheDocument()
    expect(screen.getByText('Randonnée')).toBeInTheDocument()
    expect(screen.getByText('7.5 km')).toBeInTheDocument()
    expect(screen.getByText(/Office de tourisme/)).toBeInTheDocument()
  })
})
