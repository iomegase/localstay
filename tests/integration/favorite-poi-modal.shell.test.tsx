/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import { FavoritePoiModal } from '@/features/public-menu/components/FavoritePoiModal'
import type { FavoritePoi } from '@/features/public-menu/lib/favorites'
import type { PoiDetail } from '@/features/categories/types'

jest.mock('@/features/categories/components/PoiDetailBody', () => ({
  PoiDetailBody: ({ poi }: { poi: PoiDetail }) => (
    <div data-testid="poi-detail-body-stub">{poi.name}</div>
  ),
}))

const fav: FavoritePoi = {
  poi_id: 'poi-1',
  name: 'Station de recharge',
  city_slug: 'saint-gervais-les-bains',
  category_slug: 'mobilite',
  poi_slug: 'station-de-recharge',
  photo: 'https://example.com/station.jpg',
  added_at: '2026-06-01T08:00:00.000Z',
}

const poi: PoiDetail = {
  id: 'poi-1',
  name: 'Station de recharge',
  slug: 'station-de-recharge',
  description: 'Recharge pour véhicules électriques.',
  address: 'Impasse des Lupins',
  latitude: 45.8921,
  longitude: 6.7085,
  phone: null,
  website: null,
  rating: 3.4,
  rating_count: 5,
  is_open_now: null,
  hours: null,
  photos: ['https://example.com/station.jpg'],
  distance_km: 0.179,
  category: { id: 'cat-1', name: 'Mobilité', slug: 'mobilite', icon: 'car' },
  subcategory: null,
  hiking_detail: null,
  trail_detail: null,
  merchant_offers: [],
}

describe('FavoritePoiModal — shell modal', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: poi }),
    }) as jest.Mock
  })

  it('wraps the POI detail inside a centered mobile modal shell instead of a plain full page', async () => {
    render(<FavoritePoiModal fav={fav} onClose={jest.fn()} />)

    const modal = screen.getByTestId('favorite-poi-modal')
    expect(modal).toHaveClass('bg-black/40')

    const panel = screen.getByTestId('favorite-poi-modal-panel')
    expect(panel).toHaveClass('max-w-[430px]')
    expect(panel).toHaveClass('overflow-y-auto')
    expect(panel).toHaveClass('shadow-2xl')

    await waitFor(() => {
      expect(screen.getByTestId('poi-detail-body-stub')).toHaveTextContent('Station de recharge')
    })
  })
})
