/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { PoiDetailBody } from '@/features/categories/components/PoiDetailBody'
import type { PoiDetail } from '@/features/categories/types'

jest.mock('@/shared/components/MarkdownText', () => ({
  MarkdownText: ({ source }: { source: string }) => <div>{source}</div>,
}))

jest.mock('@/features/categories/components/MiniMap', () => ({
  MiniMap: () => <div data-testid="mini-map" />,
}))

const poi: PoiDetail = {
  id: '1',
  name: 'Le Bistrot du Mont-Blanc',
  slug: 'restaurants-gastro-demo',
  description: 'Cuisine du terroir savoyard.',
  address: 'Place du Mont-Blanc, 74170 Saint-Gervais-les-Bains',
  latitude: 45.8921,
  longitude: 6.7085,
  phone: '+33 4 50 78 24 90',
  website: 'https://bistrot-mont-blanc.fr',
  rating: 4.5,
  rating_count: 120,
  is_open_now: true,
  hours: { '1': { open: '12:00', close: '14:30' } },
  photos: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'],
  distance_km: 0.3,
  category: { id: 'c1', name: 'Restaurants', slug: 'restaurants', icon: 'utensils' },
  subcategory: { id: 's1', name: 'Gastronomique', slug: 'gastronomique' },
  hiking_detail: null,
  merchant_offers: [],
}

const hikingPoi: PoiDetail = {
  ...poi,
  name: 'Lac Blanc',
  hiking_detail: {
    difficulty: 'hard',
    duration_minutes: 270,
    distance_km: 11.0,
    elevation_gain_m: 650,
    starting_point: 'Parking de la Flégère',
    parking_info: 'Payant en saison',
    kids_friendly: false,
    pets_friendly: true,
    best_season: ['summer'],
    gpx_url: null,
  },
}

describe('PoiDetailBody — AC-01-01 (all required fields rendered)', () => {
  beforeEach(() => {
    render(<PoiDetailBody poi={poi} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
  })

  it('renders the POI name as heading', () => {
    expect(screen.getByRole('heading', { name: /Le Bistrot du Mont-Blanc/i })).toBeInTheDocument()
  })

  it('renders subcategory name (shown as category label)', () => {
    expect(screen.getByText('Gastronomique')).toBeInTheDocument()
  })

  it('renders address', () => {
    expect(screen.getByText(/Place du Mont-Blanc/)).toBeInTheDocument()
  })

  it('renders description', () => {
    expect(screen.getByText('Cuisine du terroir savoyard.')).toBeInTheDocument()
  })

  it('renders rating', () => {
    expect(screen.getByTestId('poi-detail-rating')).toHaveTextContent('4.5')
  })

  it('renders rating_count', () => {
    expect(screen.getByTestId('poi-detail-rating-count')).toHaveTextContent('120')
  })

  it('renders distance', () => {
    expect(screen.getByTestId('poi-detail-distance')).toHaveTextContent('300 m')
  })

  it('renders Appeler button (phone present)', () => {
    expect(screen.getByTestId('btn-call')).toBeInTheDocument()
  })

  it('renders Site button (website present)', () => {
    expect(screen.getByTestId('btn-site')).toBeInTheDocument()
  })

  it('renders photo attribution when photos and website are present', () => {
    expect(screen.getByTestId('photo-attribution')).toHaveTextContent('Photos : bistrot-mont-blanc.fr')
    expect(screen.getByTestId('photo-attribution')).toHaveAttribute('href', 'https://bistrot-mont-blanc.fr')
  })
})

describe('PoiDetailBody — AC-01-05/AC-01-06 (contextual Owner note)', () => {
  it('renders the note after the description and before secondary blocks', () => {
    render(
      <PoiDetailBody
        poi={poi}
        citySlug="saint-gervais-les-bains"
        categorySlug="restaurants"
        ownerRecommendationNote="Notre choix pour dîner."
      />,
    )

    const description = screen.getByText('Cuisine du terroir savoyard.')
    const note = screen.getByRole('region', { name: 'Le mot de votre hôte' })
    const miniMap = screen.getByTestId('mini-map')

    expect(screen.getByText('Notre choix pour dîner.')).toBeInTheDocument()
    expect(description.compareDocumentPosition(note)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(note.compareDocumentPosition(miniMap)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })
})

describe('PoiDetailBody — AC-03-01 (hiking block conditional)', () => {
  it('renders HikingBlock when hiking_detail is present', () => {
    render(<PoiDetailBody poi={hikingPoi} citySlug="saint-gervais-les-bains" categorySlug="randonnees" />)
    expect(screen.getByTestId('hiking-difficulty')).toBeInTheDocument()
    expect(screen.getByTestId('hiking-duration')).toHaveTextContent('4h30')
  })

  it('does NOT render HikingBlock when hiking_detail is null', () => {
    render(<PoiDetailBody poi={poi} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
    expect(screen.queryByTestId('hiking-difficulty')).not.toBeInTheDocument()
  })
})
