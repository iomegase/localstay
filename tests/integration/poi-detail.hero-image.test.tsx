/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { PoiDetailBody } from '@/features/categories/components/PoiDetailBody'
import type { PoiDetail } from '@/features/categories/types'

// react-markdown est ESM (casse le transform jest) ; il est tiré transitivement par PoiDetailBody.
jest.mock('@/shared/components/MarkdownText', () => ({
  MarkdownText: ({ source }: { source: string }) => <div>{source}</div>,
}))
// MiniMap charge mapbox-gl (non rendu en jsdom) → mock léger.
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
  hours: {
    '0': { open: '12:00', close: '14:30' },
    '1': { open: '12:00', close: '14:30' },
    '2': { open: '12:00', close: '14:30' },
    '3': { open: '12:00', close: '14:30' },
    '4': { open: '12:00', close: '14:30' },
    '5': { open: '12:00', close: '14:30' },
    '6': { open: '12:00', close: '14:30' },
  },
  photos: ['https://example.com/photo-hero.jpg'],
  distance_km: 0.3,
  city: {
    name: 'Saint-Gervais-les-Bains',
    slug: 'saint-gervais-les-bains',
    region: 'Haute-Savoie',
    postal_code: '74170',
  },
  category: { id: 'c1', name: 'Restaurants', slug: 'restaurants', icon: 'utensils' },
  subcategory: { id: 's1', name: 'Gastronomique', slug: 'gastronomique' },
  hiking_detail: null,
  merchant_offers: [],
}

describe('PoiDetailBody — hero image (LCP)', () => {
  it('renders the first photo in a hero carousel using the same contain-over-blur display logic as PoiCard', () => {
    render(<PoiDetailBody poi={poi} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)

    expect(screen.getByTestId('poi-detail-hero-carousel')).toHaveClass('h-[450px]')
    expect(screen.getByTestId('poi-detail-hero-backdrop')).toHaveClass('object-cover')
    expect(screen.getByTestId('poi-detail-hero-backdrop')).toHaveClass('blur-xl')

    const hero = screen.getByRole('img', { name: 'Le Bistrot du Mont-Blanc' })
    expect(hero).toHaveAttribute('src', 'https://example.com/photo-hero.jpg')
    expect(hero).toHaveClass('object-contain')
    expect(hero).toHaveClass('object-center')
    expect(hero).not.toHaveClass('object-cover')
  })

  it('uses the category fallback hero when the POI has no photos', () => {
    render(
      <PoiDetailBody
        poi={{ ...poi, photos: [] }}
        citySlug="saint-gervais-les-bains"
        categorySlug="restaurants"
      />,
    )

    const hero = screen.getByRole('img', { name: 'Le Bistrot du Mont-Blanc' })
    expect(hero.getAttribute('src')).toContain('/fallback/fallback-restaurant.png')
    expect(screen.getByTestId('poi-detail-hero-backdrop').getAttribute('src')).toContain(
      '/fallback/fallback-restaurant.png',
    )
  })

  it('loads the hero eagerly (priority) instead of lazily, since it is above the fold', () => {
    render(<PoiDetailBody poi={poi} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)

    const hero = screen.getByRole('img', { name: 'Le Bistrot du Mont-Blanc' })
    expect(hero).not.toHaveAttribute('loading', 'lazy')
  })

  it('shows carousel arrows only when multiple photos are available and moves to the next photo', () => {
    const multiPhotoPoi: PoiDetail = {
      ...poi,
      photos: ['https://example.com/photo-1.jpg', 'https://example.com/photo-2.jpg'],
    }

    render(<PoiDetailBody poi={multiPhotoPoi} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)

    const hero = screen.getByRole('img', { name: 'Le Bistrot du Mont-Blanc' })
    expect(hero).toHaveAttribute('src', 'https://example.com/photo-1.jpg')

    fireEvent.click(screen.getByRole('button', { name: 'Photo suivante' }))

    expect(screen.getByRole('img', { name: 'Le Bistrot du Mont-Blanc' })).toHaveAttribute(
      'src',
      'https://example.com/photo-2.jpg',
    )
    expect(screen.getByLabelText('Photo 2 sur 2')).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: 'Photo précédente' })).toBeInTheDocument()
  })

  it('does not render carousel arrows for a single photo', () => {
    render(<PoiDetailBody poi={poi} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)

    expect(screen.queryByRole('button', { name: 'Photo suivante' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Photo précédente' })).not.toBeInTheDocument()
  })

  it('displays the open pill in the hero footer and keeps the closing time in the hours area', () => {
    render(<PoiDetailBody poi={poi} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)

    const hero = screen.getByTestId('poi-detail-hero-carousel')
    const openBadge = hero.querySelector('[data-testid="poi-detail-hero-open-badge"]')
    const openBadgeWrapper = hero.querySelector('[data-testid="poi-detail-hero-open-badge-wrapper"]')
    expect(openBadge).toHaveTextContent('Ouvert')
    expect(openBadge).not.toHaveClass('pb-4')
    expect(openBadgeWrapper).toHaveClass('pb-4')

    expect(screen.queryByTestId('badge-open')).not.toBeInTheDocument()
    expect(screen.getByTestId('closing-time')).toHaveTextContent('14:30')
  })
})
