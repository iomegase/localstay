/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { PoiDetailBody } from '@/features/categories/components/PoiDetailBody'
import type { PoiDetail } from '@/features/categories/types'

const poi: PoiDetail = {
  id: 'poi-1',
  name: 'La Table Alpine',
  slug: 'la-table-alpine',
  description: 'Cuisine locale.',
  address: '12 rue du Mont-Blanc',
  latitude: 45.892,
  longitude: 6.712,
  phone: null,
  website: null,
  rating: null,
  rating_count: 0,
  is_open_now: true,
  hours: null,
  photos: [],
  distance_km: 0.5,
  category: { id: 'cat-1', name: 'Dîner', slug: 'diner', icon: 'utensils' },
  subcategory: null,
  hiking_detail: null,
  merchant_offers: [
    {
      id: 'offer-active',
      title: 'Dessert offert',
      description: 'Sur présentation de StayLocal',
      ends_at: '2026-06-01T12:00:00.000Z',
      status: 'active',
    },
    {
      id: 'offer-expired',
      title: 'Ancienne offre',
      description: 'Déjà terminée',
      ends_at: '2026-05-01T12:00:00.000Z',
      status: 'expired',
    },
  ],
}

describe('015 public POI merchant offers', () => {
  it('AC-03-01/02: renders active merchant offers and hides expired offers', () => {
    render(<PoiDetailBody poi={poi} citySlug="saint-gervais-les-bains" categorySlug="diner" />)

    expect(screen.getByText('Dessert offert')).toBeInTheDocument()
    expect(screen.getByText('Sur présentation de StayLocal')).toBeInTheDocument()
    expect(screen.queryByText('Ancienne offre')).not.toBeInTheDocument()
  })
})
