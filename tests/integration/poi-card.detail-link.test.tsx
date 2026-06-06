/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { PoiCard } from '@/features/categories/components/PoiCard'
import type { PoiCard as PoiCardType } from '@/features/categories/types'

// react-markdown est ESM (casse le transform jest) → MarkdownText mocké.
jest.mock('@/shared/components/MarkdownText', () => ({
  MarkdownText: ({ source }: { source: string }) => <div>{source}</div>,
}))

const poi: PoiCardType = {
  id: 'p1',
  name: 'Le Bistrot du Mont-Blanc',
  slug: 'le-bistrot-du-mont-blanc',
  address: '1 rue du Mont-Blanc',
  subcategory_name: 'Gastronomique',
  rating: 4.5,
  rating_count: 120,
  is_open_now: true,
  distance_km: 1.2,
  photo_url: null,
  photos: [],
  phone: null,
  website: null,
  description: null,
  closes_at_label: null,
  next_open_label: null,
  latitude: 45.9,
  longitude: 6.7,
  trail_detail: null,
}

describe('PoiCard — internal link to the detail page (SEO/GEO)', () => {
  it('renders the POI name as a crawlable link to its canonical detail page', () => {
    render(<PoiCard poi={poi} citySlug="annecy" categorySlug="restaurants" />)
    const link = screen.getByRole('link', { name: poi.name })
    expect(link).toHaveAttribute('href', '/guide/annecy/restaurants/le-bistrot-du-mont-blanc')
  })

  it('keeps the POI name inside a heading for hierarchy', () => {
    render(<PoiCard poi={poi} citySlug="annecy" categorySlug="restaurants" />)
    expect(screen.getByRole('heading', { name: poi.name })).toBeInTheDocument()
  })
})
