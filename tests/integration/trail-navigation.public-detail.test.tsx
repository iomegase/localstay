/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { PoiDetailBody } from '@/features/categories/components/PoiDetailBody'
import type { PoiDetail } from '@/features/categories/types'

jest.mock('@/features/categories/components/MiniMap', () => ({
  MiniMap: () => <div data-testid="legacy-mini-map" />,
}))

const trailPoi = {
  id: 'poi-trail-1',
  name: "Mont Joux en passant par la Crête du Mont d'Arbois",
  slug: 'mont-joux-crete-mont-darbois',
  description: "Une balade idéale en famille pour s'initier aux joies de la randonnée.",
  address: "Arrivée de la télécabine Bettex/Mont d'Arbois",
  latitude: 45.8731,
  longitude: 6.673,
  phone: null,
  website: null,
  rating: null,
  rating_count: 0,
  is_open_now: null,
  hours: null,
  photos: ['https://example.com/mont-joux.jpg', 'https://example.com/sentier.jpg'],
  distance_km: 5.1,
  category: { id: 'cat-rando', name: 'Rando', slug: 'rando', icon: 'mountain' },
  subcategory: null,
  trail_detail: {
    difficulty: 'easy',
    estimated_duration_min: 60,
    distance_km: 2.7,
    elevation_gain_m: 166,
    start_label: "Arrivée de la télécabine Bettex/Mont d'Arbois (1833 m)",
    start_latitude: 45.8731,
    start_longitude: 6.673,
    geometry_geojson: {
      type: 'LineString',
      coordinates: [
        [6.673, 45.8731],
        [6.681, 45.878],
      ],
    },
    parking_info: null,
    kids_friendly: true,
    pets_friendly: null,
    best_season: ['summer'],
    gpx_url: null,
    data_quality_status: 'complete',
    primary_source_type: 'official_website',
    source_refs: [{ type: 'official_website', attribution: 'www.saintgervais.com', used_for: ['content'] }],
  },
  hiking_detail: null,
  merchant_offers: [],
} satisfies PoiDetail

describe('021 public trail detail', () => {
  it('AC-01-01/AC-02-01/AC-04-03: renders trail CTAs and safety copy from the trail mockup', () => {
    render(<PoiDetailBody poi={trailPoi} citySlug="saint-gervais-les-bains" categorySlug="rando" />)

    expect(screen.getByRole('link', { name: /commencer la rando/i })).toHaveAttribute(
      'href',
      '/guide/saint-gervais-les-bains/rando/mont-joux-crete-mont-darbois/start',
    )
    expect(screen.getByRole('link', { name: /rejoindre le départ/i })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=45.8731%2C6.673',
    )
    expect(screen.getByText(/MyStay ne remplace pas une carte officielle/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /réserver/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/^Itinéraire$/i)).not.toBeInTheDocument()
  })

  it('AC-01-05: uses Google Maps only for Rejoindre le départ and keeps Commencer la rando inside StayLocal', () => {
    render(<PoiDetailBody poi={trailPoi} citySlug="saint-gervais-les-bains" categorySlug="rando" />)

    expect(screen.getByRole('link', { name: /rejoindre le départ/i })).toHaveAttribute(
      'href',
      expect.stringContaining('google.com/maps/dir'),
    )
    expect(screen.getByRole('link', { name: /commencer la rando/i })).toHaveAttribute(
      'href',
      '/guide/saint-gervais-les-bains/rando/mont-joux-crete-mont-darbois/start',
    )
    expect(screen.getByRole('link', { name: /commencer la rando/i })).not.toHaveAttribute(
      'href',
      expect.stringContaining('google.com/maps'),
    )
    expect(document.body.innerHTML).not.toContain('maps.apple.com')
  })

  it('AC-01-04/AC-02-05: hides navigation CTAs when trail start or geometry is missing', () => {
    const incompleteTrail = {
      ...trailPoi,
      trail_detail: {
        ...trailPoi.trail_detail,
        start_latitude: null,
        start_longitude: null,
        geometry_geojson: null,
      },
    } as unknown as PoiDetail

    render(<PoiDetailBody poi={incompleteTrail} citySlug="saint-gervais-les-bains" categorySlug="rando" />)

    expect(screen.queryByRole('link', { name: /commencer la rando/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /rejoindre le départ/i })).not.toBeInTheDocument()
  })
})
