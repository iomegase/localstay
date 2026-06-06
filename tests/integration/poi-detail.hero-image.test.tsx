/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
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
// PhotoCarousel rend la galerie (autres <img>) → mocké pour isoler le héros.
jest.mock('@/features/categories/components/PhotoCarousel', () => ({
  PhotoCarousel: () => <div data-testid="photo-carousel" />,
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
  beforeEach(() => {
    render(<PoiDetailBody poi={poi} citySlug="saint-gervais-les-bains" categorySlug="restaurants" />)
  })

  it('renders the first photo as the hero image, covering its container', () => {
    const hero = screen.getByRole('img', { name: 'Le Bistrot du Mont-Blanc' })
    expect(hero).toHaveAttribute('src', 'https://example.com/photo-hero.jpg')
    expect(hero).toHaveClass('object-cover')
    expect(hero).not.toHaveClass('objobject-center')
  })

  it('loads the hero eagerly (priority) instead of lazily, since it is above the fold', () => {
    const hero = screen.getByRole('img', { name: 'Le Bistrot du Mont-Blanc' })
    expect(hero).not.toHaveAttribute('loading', 'lazy')
  })
})
