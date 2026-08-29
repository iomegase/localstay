/** @jest-environment node */

const mockGetActiveLodgingContext = jest.fn()
const mockGetDiscoveryCity = jest.fn()
const mockGetDiscoveryCategory = jest.fn()
const mockGetDiscoveryPoi = jest.fn()
const mockGetCityGuide = jest.fn()
const mockGetAllPoiCards = jest.fn()
const mockGetCategoryDetail = jest.fn()
const mockGetPoiCards = jest.fn()
const mockGetCategoriesForCity = jest.fn()
const mockGetPoiDetail = jest.fn()
const mockGetContextualOwnerNote = jest.fn()
const mockGetCityForSeo = jest.fn()
const mockGetCategoryForSeo = jest.fn()
const mockPermanentRedirect = jest.fn((destination: string) => {
  throw new Error(`NEXT_PERMANENT_REDIRECT:${destination}`)
})
const mockNotFound = jest.fn(() => {
  throw new Error('NEXT_NOT_FOUND')
})

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
  permanentRedirect: (destination: string) => mockPermanentRedirect(destination),
}))

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: () => mockGetActiveLodgingContext(),
}))

jest.mock('@/features/public-discovery/queries/public-discovery', () => ({
  getDiscoveryCity: (...args: unknown[]) => mockGetDiscoveryCity(...args),
  getDiscoveryCategory: (...args: unknown[]) => mockGetDiscoveryCategory(...args),
  getDiscoveryPoi: (...args: unknown[]) => mockGetDiscoveryPoi(...args),
}))

jest.mock('@/features/city-guide/queries/cities', () => ({
  getCityGuide: (...args: unknown[]) => mockGetCityGuide(...args),
}))

jest.mock('@/features/categories/queries/all-poi-cards', () => ({
  getAllPoiCards: (...args: unknown[]) => mockGetAllPoiCards(...args),
}))

jest.mock('@/features/categories/queries/categories', () => ({
  getCategoryDetail: (...args: unknown[]) => mockGetCategoryDetail(...args),
  getCategoriesForCity: (...args: unknown[]) => mockGetCategoriesForCity(...args),
}))

jest.mock('@/features/categories/queries/poi-cards', () => ({
  getPoiCards: (...args: unknown[]) => mockGetPoiCards(...args),
}))

jest.mock('@/features/categories/queries/poi-detail', () => ({
  getPoiDetail: (...args: unknown[]) => mockGetPoiDetail(...args),
}))

jest.mock('@/features/guide-customization/queries/contextual-owner-note', () => ({
  getContextualOwnerNote: (...args: unknown[]) => mockGetContextualOwnerNote(...args),
}))

jest.mock('@/features/seo/queries/page-data', () => ({
  getCityForSeo: (...args: unknown[]) => mockGetCityForSeo(...args),
  getCategoryForSeo: (...args: unknown[]) => mockGetCategoryForSeo(...args),
}))

jest.mock('@/features/analytics/lib/record-qr-scan', () => ({
  recordQrScanIfPresent: jest.fn(),
}))

jest.mock('@/features/events-public/queries/agenda', () => ({
  cityHasUpcomingEventsBySlug: jest.fn(),
}))

import GuidePage, {
  generateMetadata as generateCityMetadata,
} from '@/app/(public)/guide/[city-slug]/page'
import CategoryPage, {
  generateMetadata as generateCategoryMetadata,
} from '@/app/(public)/guide/[city-slug]/[category-slug]/page'
import PoiDetailPage, {
  generateMetadata as generatePoiMetadata,
} from '@/app/(public)/guide/[city-slug]/[category-slug]/[poi-slug]/page'

const citySlug = 'saint-gervais-les-bains'
const categorySlug = 'diner'
const poiSlug = 'le-serac'

describe('041 public discovery — AC-05 legacy redirects', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetActiveLodgingContext.mockResolvedValue(null)
  })

  it('redirects an anonymous legacy City only when its public destination exists', async () => {
    mockGetDiscoveryCity.mockResolvedValue({ slug: citySlug })

    await expect(GuidePage({
      params: Promise.resolve({ 'city-slug': citySlug }),
    })).rejects.toThrow(`NEXT_PERMANENT_REDIRECT:/decouvrir/${citySlug}`)

    expect(mockGetDiscoveryCity).toHaveBeenCalledWith(citySlug)
    expect(mockGetCityGuide).not.toHaveBeenCalled()
    expect(mockGetAllPoiCards).not.toHaveBeenCalled()
  })

  it('uses canonical DTO slugs instead of mixed-case legacy City parameters', async () => {
    mockGetDiscoveryCity.mockResolvedValue({ slug: citySlug })

    await expect(GuidePage({
      params: Promise.resolve({ 'city-slug': 'Saint-Gervais-Les-Bains' }),
    })).rejects.toThrow(`NEXT_PERMANENT_REDIRECT:/decouvrir/${citySlug}`)
  })

  it('redirects an anonymous legacy City without a public destination to the discovery hub', async () => {
    mockGetDiscoveryCity.mockResolvedValue(null)

    await expect(GuidePage({
      params: Promise.resolve({ 'city-slug': citySlug }),
    })).rejects.toThrow('NEXT_PERMANENT_REDIRECT:/decouvrir')

    expect(mockPermanentRedirect).toHaveBeenCalledWith('/decouvrir')
    expect(mockGetCityGuide).not.toHaveBeenCalled()
  })

  it('redirects an anonymous legacy Category only when its public destination exists', async () => {
    mockGetDiscoveryCategory.mockResolvedValue({
      slug: categorySlug,
      city: { slug: citySlug },
    })

    await expect(CategoryPage({
      params: Promise.resolve({
        'city-slug': citySlug,
        'category-slug': categorySlug,
      }),
      searchParams: Promise.resolve({}),
    })).rejects.toThrow(
      `NEXT_PERMANENT_REDIRECT:/decouvrir/${citySlug}/${categorySlug}`,
    )

    expect(mockGetDiscoveryCategory).toHaveBeenCalledWith(citySlug, categorySlug)
    expect(mockGetCategoryDetail).not.toHaveBeenCalled()
    expect(mockGetPoiCards).not.toHaveBeenCalled()
    expect(mockGetCategoriesForCity).not.toHaveBeenCalled()
  })

  it('uses canonical DTO slugs instead of mixed-case legacy Category parameters', async () => {
    mockGetDiscoveryCategory.mockResolvedValue({
      slug: categorySlug,
      city: { slug: citySlug },
    })

    await expect(CategoryPage({
      params: Promise.resolve({
        'city-slug': 'Saint-Gervais-Les-Bains',
        'category-slug': 'Diner',
      }),
      searchParams: Promise.resolve({}),
    })).rejects.toThrow(
      `NEXT_PERMANENT_REDIRECT:/decouvrir/${citySlug}/${categorySlug}`,
    )
  })

  it('returns 404 for an anonymous legacy Category without a public destination', async () => {
    mockGetDiscoveryCategory.mockResolvedValue(null)

    await expect(CategoryPage({
      params: Promise.resolve({
        'city-slug': citySlug,
        'category-slug': categorySlug,
      }),
      searchParams: Promise.resolve({}),
    })).rejects.toThrow('NEXT_NOT_FOUND')

    expect(mockPermanentRedirect).not.toHaveBeenCalled()
    expect(mockGetCategoryDetail).not.toHaveBeenCalled()
  })

  it('redirects an anonymous legacy POI before loading any private POI or Owner note', async () => {
    mockGetDiscoveryPoi.mockResolvedValue({
      slug: poiSlug,
      city: { slug: citySlug },
      category: { slug: categorySlug },
    })

    await expect(PoiDetailPage({ params: Promise.resolve({
      'city-slug': citySlug,
      'category-slug': categorySlug,
      'poi-slug': poiSlug,
    }) })).rejects.toThrow(
      `NEXT_PERMANENT_REDIRECT:/decouvrir/${citySlug}/${categorySlug}/${poiSlug}`,
    )

    expect(mockGetDiscoveryPoi).toHaveBeenCalledWith(citySlug, categorySlug, poiSlug)
    expect(mockGetPoiDetail).not.toHaveBeenCalled()
    expect(mockGetContextualOwnerNote).not.toHaveBeenCalled()
  })

  it('uses canonical DTO slugs instead of mixed-case legacy POI parameters', async () => {
    mockGetDiscoveryPoi.mockResolvedValue({
      slug: poiSlug,
      city: { slug: citySlug },
      category: { slug: categorySlug },
    })

    await expect(PoiDetailPage({ params: Promise.resolve({
      'city-slug': 'Saint-Gervais-Les-Bains',
      'category-slug': 'Diner',
      'poi-slug': 'Le-Serac',
    }) })).rejects.toThrow(
      `NEXT_PERMANENT_REDIRECT:/decouvrir/${citySlug}/${categorySlug}/${poiSlug}`,
    )
  })

  it('returns 404 for an anonymous unpublished POI without loading private data', async () => {
    mockGetDiscoveryPoi.mockResolvedValue(null)

    await expect(PoiDetailPage({ params: Promise.resolve({
      'city-slug': citySlug,
      'category-slug': categorySlug,
      'poi-slug': poiSlug,
    }) })).rejects.toThrow('NEXT_NOT_FOUND')

    expect(mockPermanentRedirect).not.toHaveBeenCalled()
    expect(mockGetPoiDetail).not.toHaveBeenCalled()
    expect(mockGetContextualOwnerNote).not.toHaveBeenCalled()
  })

  it('keeps the historical private POI branch for a valid stay context', async () => {
    mockGetActiveLodgingContext.mockResolvedValue({
      lodgingId: '11111111-1111-1111-1111-111111111111',
      lodgingName: 'Chalet MyStay',
      citySlug,
      cityName: 'Saint-Gervais-les-Bains',
      ownerName: 'Marie',
    })
    mockGetPoiDetail.mockResolvedValue(null)

    await expect(PoiDetailPage({ params: Promise.resolve({
      'city-slug': citySlug,
      'category-slug': categorySlug,
      'poi-slug': poiSlug,
    }) })).rejects.toThrow('NEXT_NOT_FOUND')

    expect(mockGetDiscoveryPoi).not.toHaveBeenCalled()
    expect(mockGetPoiDetail).toHaveBeenCalledWith(
      citySlug,
      categorySlug,
      poiSlug,
      '11111111-1111-1111-1111-111111111111',
    )
  })

  it('keeps unpublished legacy metadata non-indexable without loading private records', async () => {
    mockGetDiscoveryCity.mockResolvedValue(null)
    mockGetDiscoveryCategory.mockResolvedValue(null)
    mockGetDiscoveryPoi.mockResolvedValue(null)

    const cityMetadata = await generateCityMetadata({
      params: Promise.resolve({ 'city-slug': citySlug }),
    })
    const categoryMetadata = await generateCategoryMetadata({
      params: Promise.resolve({
        'city-slug': citySlug,
        'category-slug': categorySlug,
      }),
      searchParams: Promise.resolve({}),
    })
    const poiMetadata = await generatePoiMetadata({ params: Promise.resolve({
      'city-slug': citySlug,
      'category-slug': categorySlug,
      'poi-slug': poiSlug,
    }) })

    expect(cityMetadata.robots).toMatchObject({ index: false, follow: false })
    expect(categoryMetadata.robots).toMatchObject({ index: false, follow: false })
    expect(poiMetadata.robots).toMatchObject({ index: false, follow: false })
    expect(mockGetCityForSeo).not.toHaveBeenCalled()
    expect(mockGetCategoryForSeo).not.toHaveBeenCalled()
    expect(mockGetPoiDetail).not.toHaveBeenCalled()
  })
})
