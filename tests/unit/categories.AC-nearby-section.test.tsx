/**
 * @jest-environment jsdom
 */
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryViewWrapper } from '@/features/categories/components/CategoryViewWrapper'
import { storeLocation } from '@/features/geolocation/lib/user-location'
import type { PoiCard } from '@/features/categories/types'

// FullMap uses dynamic import + Mapbox — mock it
jest.mock('@/features/categories/components/FullMap', () => ({
  FullMap: () => <div data-testid="full-map" />,
}))

jest.mock('@/shared/components/MarkdownText', () => ({
  MarkdownText: ({ source }: { source?: string | null }) => <div>{source}</div>,
}))

const CITY_CENTER = { latitude: 45.8921, longitude: 6.7085 }

function makePoi(overrides: Partial<PoiCard> & { id: string; name: string }): PoiCard {
  return {
    slug: overrides.id,
    address: '1 Rue Test',
    subcategory_name: null,
    rating: null,
    rating_count: 0,
    is_open_now: null,
    distance_km: 1,
    photo_url: null,
    photos: [],
    phone: null,
    description: null,
    closes_at_label: null,
    latitude: 45.8921,
    longitude: 6.7085,
    ...overrides,
  }
}

const primaryPoi = makePoi({ id: 'p1', name: 'Café du Centre', distance_km: 2 })
const nearbyPoi = makePoi({ id: 'n1', name: 'Chalet des Alpes', distance_km: 18 })

describe('CategoryViewWrapper — nearby section (BR-06)', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    window.localStorage.clear()
  })

  it('renders primary POIs in the main list', () => {
    render(
      <CategoryViewWrapper
        primary={[primaryPoi]}
        nearby={[]}
        citySlug="saint-gervais"
        categorySlug="restaurants"
        cityCenter={CITY_CENTER}
      />,
    )
    expect(screen.getByText('Café du Centre')).toBeInTheDocument()
  })

  it('does NOT render nearby section when nearby is empty', () => {
    render(
      <CategoryViewWrapper
        primary={[primaryPoi]}
        nearby={[]}
        citySlug="saint-gervais"
        categorySlug="restaurants"
        cityCenter={CITY_CENTER}
      />,
    )
    expect(screen.queryByText('Autres activités aux alentours')).not.toBeInTheDocument()
  })

  it('renders nearby section with heading when nearby has POIs', () => {
    render(
      <CategoryViewWrapper
        primary={[primaryPoi]}
        nearby={[nearbyPoi]}
        citySlug="saint-gervais"
        categorySlug="restaurants"
        cityCenter={CITY_CENTER}
      />,
    )
    expect(screen.getByText('Autres activités aux alentours')).toBeInTheDocument()
    expect(screen.getByText('Chalet des Alpes')).toBeInTheDocument()
  })

  it('renders both primary and nearby POIs', () => {
    render(
      <CategoryViewWrapper
        primary={[primaryPoi]}
        nearby={[nearbyPoi]}
        citySlug="saint-gervais"
        categorySlug="restaurants"
        cityCenter={CITY_CENTER}
      />,
    )
    expect(screen.getByText('Café du Centre')).toBeInTheDocument()
    expect(screen.getByText('Chalet des Alpes')).toBeInTheDocument()
  })

  it('renders "Aucun résultat" when primary is empty and nearby is empty', () => {
    render(
      <CategoryViewWrapper
        primary={[]}
        nearby={[]}
        citySlug="saint-gervais"
        categorySlug="restaurants"
        cityCenter={CITY_CENTER}
      />,
    )
    expect(screen.getByText('Aucun résultat')).toBeInTheDocument()
  })

  it('uses the Tourist GPS position for displayed distance after explicit opt-in', () => {
    render(
      <CategoryViewWrapper
        primary={[{ ...primaryPoi, distance_km: 10 }]}
        nearby={[]}
        citySlug="saint-gervais"
        categorySlug="restaurants"
        cityCenter={CITY_CENTER}
      />,
    )

    // Avant opt-in : distance serveur (depuis le centre-ville).
    expect(screen.getByTestId('poi-distance')).toHaveTextContent('10.0 km')

    // L'opt-in se fait désormais via le bouton de géolocalisation de la nav du
    // footer, qui stocke et diffuse la position à toute l'app (shared hook).
    act(() => {
      storeLocation({ latitude: 45.8921, longitude: 6.7085 })
    })

    // La position coïncide avec le POI → 0 m.
    expect(screen.getByTestId('poi-distance')).toHaveTextContent('0 m')
  })

  it('loads the next page through the POI API when more results are available', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          primary: [makePoi({ id: 'p2', name: 'Salon de thé', distance_km: 3 })],
          nearby: [],
        },
        meta: {
          total: 2,
          page: 2,
          limit: 1,
          total_pages: 2,
          primary_total: 2,
          nearby_total: 0,
          primary_total_pages: 2,
          nearby_total_pages: 0,
        },
      }),
    })

    render(
      <CategoryViewWrapper
        primary={[primaryPoi]}
        nearby={[]}
        citySlug="saint-gervais"
        categorySlug="restaurants"
        cityCenter={CITY_CENTER}
        sort="distance"
        page={1}
        limit={1}
        totalPages={2}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /charger plus/i }))

    expect(global.fetch).toHaveBeenCalledWith('/api/cities/saint-gervais/categories/restaurants/pois?sort=distance&page=2&limit=1')
    expect(await screen.findByText('Salon de thé')).toBeInTheDocument()
  })
})
