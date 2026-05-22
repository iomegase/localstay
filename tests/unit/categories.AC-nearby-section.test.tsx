/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { CategoryViewWrapper } from '@/features/categories/components/CategoryViewWrapper'
import type { PoiCard } from '@/features/categories/types'

// FullMap uses dynamic import + Mapbox — mock it
jest.mock('@/features/categories/components/FullMap', () => ({
  FullMap: () => <div data-testid="full-map" />,
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
    latitude: 45.8921,
    longitude: 6.7085,
    ...overrides,
  }
}

const primaryPoi = makePoi({ id: 'p1', name: 'Café du Centre', distance_km: 2 })
const nearbyPoi = makePoi({ id: 'n1', name: 'Chalet des Alpes', distance_km: 18 })

describe('CategoryViewWrapper — nearby section (BR-06)', () => {
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
})
