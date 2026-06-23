/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import PoiDetailPage, { generateMetadata } from '@/app/(public)/guide/[city-slug]/[category-slug]/[poi-slug]/page'
import type { PoiDetail } from '@/features/categories/types'

const mockGetPoiDetail = jest.fn()
const mockGetActiveLodgingContext = jest.fn()
const mockGetContextualOwnerNote = jest.fn()
const mockJsonLd = jest.fn()
const mockNotFound = jest.fn()

jest.mock('@/features/categories/queries/poi-detail', () => ({
  getPoiDetail: (...args: unknown[]) => mockGetPoiDetail(...args),
}))

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: () => mockGetActiveLodgingContext(),
}))

jest.mock('@/features/guide-customization/queries/contextual-owner-note', () => ({
  getContextualOwnerNote: (...args: unknown[]) => mockGetContextualOwnerNote(...args),
}))

jest.mock('@/features/categories/components/PoiDetailBody', () => ({
  PoiDetailBody: ({
    poi,
    ownerRecommendationNote,
  }: {
    poi: PoiDetail
    ownerRecommendationNote?: string | null
  }) => (
    <main data-testid="poi-detail-body" data-owner-note={ownerRecommendationNote ?? ''}>
      {poi.name}
    </main>
  ),
}))

jest.mock('@/shared/components/JsonLd', () => ({
  JsonLd: ({ data }: { data: object | object[] }) => {
    mockJsonLd(data)
    return <script data-testid="json-ld" type="application/ld+json" />
  },
}))

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
}))

const poi: PoiDetail = {
  id: 'poi-1',
  name: 'La Vieille Auberge',
  slug: 'la-vieille-auberge',
  description: 'Auberge savoyarde historique.',
  address: '12 route Notre-Dame de la Gorge',
  latitude: 45.821,
  longitude: 6.728,
  phone: '+33 4 50 00 00 00',
  website: 'https://auberge.example.com',
  rating: 4.6,
  rating_count: 82,
  is_open_now: true,
  hours: null,
  photos: ['https://img.example.com/auberge.jpg'],
  distance_km: 0.5,
  city: {
    name: 'Les Contamines-Montjoie',
    slug: 'les-contamines-montjoie',
    region: 'Auvergne-Rhône-Alpes',
    postal_code: '74170',
  },
  category: { id: 'cat-1', name: 'Dîner', slug: 'diner', icon: 'utensils' },
  subcategory: null,
  hiking_detail: null,
  trail_detail: null,
  merchant_offers: [],
}

const params = Promise.resolve({
  'city-slug': 'les-contamines-montjoie',
  'category-slug': 'diner',
  'poi-slug': 'la-vieille-auberge',
})

describe('POI detail page — AC-01-05/AC-01-06 contextual Owner note', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetPoiDetail.mockResolvedValue(poi)
  })

  it('passes only the active Lodging note to the POI detail body', async () => {
    mockGetActiveLodgingContext.mockResolvedValue({
      lodgingId: 'lodging-1',
      lodgingName: 'Chalet MyStay',
      citySlug: 'saint-gervais-les-bains',
      cityName: 'Saint-Gervais-les-Bains',
      ownerName: 'Marie Martin',
    })
    mockGetContextualOwnerNote.mockResolvedValue('Demandez la table près du poêle.')

    render(await PoiDetailPage({ params }))

    expect(mockGetContextualOwnerNote).toHaveBeenCalledWith('lodging-1', 'poi-1')
    expect(screen.getByTestId('poi-detail-body')).toHaveAttribute(
      'data-owner-note',
      'Demandez la table près du poêle.',
    )
  })

  it('does not resolve or render an Owner note without active Lodging context', async () => {
    mockGetActiveLodgingContext.mockResolvedValue(null)

    render(await PoiDetailPage({ params }))

    expect(mockGetContextualOwnerNote).not.toHaveBeenCalled()
    expect(screen.getByTestId('poi-detail-body')).toHaveAttribute('data-owner-note', '')
  })

  it('keeps the contextual Owner note out of metadata and JSON-LD', async () => {
    mockGetActiveLodgingContext.mockResolvedValue({
      lodgingId: 'lodging-1',
      lodgingName: 'Chalet MyStay',
      citySlug: 'saint-gervais-les-bains',
      cityName: 'Saint-Gervais-les-Bains',
      ownerName: 'Marie Martin',
    })
    mockGetContextualOwnerNote.mockResolvedValue('Note strictement contextuelle.')

    const metadata = await generateMetadata({ params })
    render(await PoiDetailPage({ params }))

    expect(mockGetActiveLodgingContext).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(metadata)).not.toContain('Note strictement contextuelle.')
    expect(JSON.stringify(mockJsonLd.mock.calls[0][0])).not.toContain('Note strictement contextuelle.')
  })
})
