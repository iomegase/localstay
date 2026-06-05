/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryViewWrapper } from '@/features/categories/components/CategoryViewWrapper'
import { AllPoisList } from '@/features/categories/components/AllPoisList'
import type { PoiCard } from '@/features/categories/types'
import type { AllPoisCard } from '@/features/categories/queries/all-poi-cards'

jest.mock('@/shared/components/MarkdownText', () => ({
  MarkdownText: ({ source }: { source: string }) => <div>{source}</div>,
}))

const CITY_CENTER = { latitude: 45.8921, longitude: 6.7085 }

function makePoi(overrides: Partial<PoiCard> & { id: string; name: string; slug: string; description: string }): PoiCard {
  return {
    id: overrides.id,
    name: overrides.name,
    slug: overrides.slug,
    address: '1 Rue Test',
    subcategory_name: null,
    rating: null,
    rating_count: 0,
    is_open_now: null,
    distance_km: 1,
    photo_url: null,
    photos: [],
    phone: null,
    website: null,
    description: overrides.description,
    closes_at_label: null,
    latitude: 45.8921,
    longitude: 6.7085,
    ...overrides,
  }
}

const firstPoi = makePoi({
  id: 'p1',
  name: 'Café du Centre',
  slug: 'cafe-du-centre',
  description: 'Description du premier POI',
})

const secondPoi = makePoi({
  id: 'p2',
  name: 'Salon de thé',
  slug: 'salon-de-the',
  description: 'Description du second POI',
})

describe('POI accordion single-open behaviour', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'scrollTo', {
      value: jest.fn(),
      writable: true,
    })
  })

  it('closes the first category POI card when a second one is opened', async () => {
    render(
      <CategoryViewWrapper
        primary={[firstPoi, secondPoi]}
        nearby={[]}
        citySlug="saint-gervais"
        categorySlug="restaurants"
        cityCenter={CITY_CENTER}
      />,
    )

    await userEvent.click(screen.getByText('Café du Centre'))
    expect(screen.getByText('Description du premier POI')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Salon de thé'))
    expect(screen.getByText('Description du second POI')).toBeInTheDocument()
    expect(screen.queryByText('Description du premier POI')).not.toBeInTheDocument()
  })

  it('closes the first all-POI card when another one is opened', async () => {
    const allPois: AllPoisCard[] = [
      { ...firstPoi, category_slug: 'restaurants' },
      { ...secondPoi, category_slug: 'restaurants' },
    ]

    render(
      <AllPoisList
        citySlug="saint-gervais"
        initialItems={allPois}
        initialMeta={{ page: 1, limit: 10, total: 2, total_pages: 1 }}
      />,
    )

    await userEvent.click(screen.getByText('Café du Centre'))
    expect(screen.getByText('Description du premier POI')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Salon de thé'))
    expect(screen.getByText('Description du second POI')).toBeInTheDocument()
    expect(screen.queryByText('Description du premier POI')).not.toBeInTheDocument()
  })
})
