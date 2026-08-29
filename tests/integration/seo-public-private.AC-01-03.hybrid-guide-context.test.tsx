/** @jest-environment node */

const mockGetOptionalActiveLodgingContext = jest.fn()
const mockGetActiveLodgingContext = jest.fn()
const mockGetDiscoveryCategory = jest.fn()
const mockGetDiscoveryPoi = jest.fn()
const mockGetCategoryDetail = jest.fn()
const mockGetCategoriesForCity = jest.fn()
const mockGetPoiCards = jest.fn()
const mockGetCategoryForSeo = jest.fn()
const mockGetPoiDetail = jest.fn()
const mockGetContextualOwnerNote = jest.fn()
const mockNotFound = jest.fn(() => {
  throw new Error('NOT_FOUND')
})
const mockPermanentRedirect = jest.fn((destination: string) => {
  throw new Error(`PERMANENT_REDIRECT:${destination}`)
})

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
  permanentRedirect: (destination: string) => mockPermanentRedirect(destination),
}))

jest.mock('@/features/public-menu/lib/private-stay-guard', () => ({
  getOptionalActiveLodgingContext: (...args: unknown[]) =>
    mockGetOptionalActiveLodgingContext(...args),
}))

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: () => mockGetActiveLodgingContext(),
}))

jest.mock('@/features/public-discovery/queries/public-discovery', () => ({
  getDiscoveryCategory: (...args: unknown[]) => mockGetDiscoveryCategory(...args),
  getDiscoveryPoi: (...args: unknown[]) => mockGetDiscoveryPoi(...args),
}))

jest.mock('@/features/categories/queries/categories', () => ({
  getCategoryDetail: (...args: unknown[]) => mockGetCategoryDetail(...args),
  getCategoriesForCity: (...args: unknown[]) => mockGetCategoriesForCity(...args),
}))

jest.mock('@/features/categories/queries/poi-cards', () => ({
  getPoiCards: (...args: unknown[]) => mockGetPoiCards(...args),
}))

jest.mock('@/features/seo/queries/page-data', () => ({
  getCategoryForSeo: (...args: unknown[]) => mockGetCategoryForSeo(...args),
}))

jest.mock('@/features/categories/queries/poi-detail', () => ({
  getPoiDetail: (...args: unknown[]) => mockGetPoiDetail(...args),
}))

jest.mock('@/features/guide-customization/queries/contextual-owner-note', () => ({
  getContextualOwnerNote: (...args: unknown[]) =>
    mockGetContextualOwnerNote(...args),
}))

jest.mock('@/features/city-guide/components/CategoryRow', () => ({
  CategoryRow: () => null,
}))
jest.mock('@/features/categories/components/SubCategoryFilter', () => ({
  SubCategoryFilter: () => null,
}))
jest.mock('@/features/categories/components/SortControl', () => ({
  SortControl: () => null,
}))
jest.mock('@/features/categories/components/CategoryViewWrapper', () => ({
  CategoryViewWrapper: () => null,
}))
jest.mock('@/features/categories/components/PoiDetailBody', () => ({
  PoiDetailBody: () => null,
}))
jest.mock('@/shared/components/JsonLd', () => ({
  JsonLd: () => null,
}))

import CategoryPage, {
  generateMetadata as generateCategoryMetadata,
} from '@/app/(public)/guide/[city-slug]/[category-slug]/page'
import PoiDetailPage, {
  generateMetadata as generatePoiMetadata,
} from '@/app/(public)/guide/[city-slug]/[category-slug]/[poi-slug]/page'

const CITY_SLUG = 'saint-gervais-les-bains'
const CATEGORY_SLUG = 'rando'
const POI_SLUG = 'col-de-tricot'
const ACCESS_DENIED = new Error('REDIRECT:/acces-reserve')

const categoryProps = {
  params: Promise.resolve({
    'city-slug': CITY_SLUG,
    'category-slug': CATEGORY_SLUG,
  }),
  searchParams: Promise.resolve({}),
}

const poiProps = {
  params: Promise.resolve({
    'city-slug': CITY_SLUG,
    'category-slug': CATEGORY_SLUG,
    'poi-slug': POI_SLUG,
  }),
}

const PUBLIC_CATEGORY = {
  name: 'Randonnées',
  slug: CATEGORY_SLUG,
  city: { name: 'Saint-Gervais-les-Bains', slug: CITY_SLUG },
  pois: [],
}

const PUBLIC_POI = {
  name: 'Col de Tricot',
  slug: POI_SLUG,
  description: 'Randonnée locale.',
  hero_photo_url: null,
  city: { name: 'Saint-Gervais-les-Bains', slug: CITY_SLUG },
  category: { name: 'Randonnées', slug: CATEGORY_SLUG },
}

function expectNoPrivateQuery(): void {
  expect(mockGetCategoryDetail).not.toHaveBeenCalled()
  expect(mockGetCategoriesForCity).not.toHaveBeenCalled()
  expect(mockGetPoiCards).not.toHaveBeenCalled()
  expect(mockGetCategoryForSeo).not.toHaveBeenCalled()
  expect(mockGetPoiDetail).not.toHaveBeenCalled()
  expect(mockGetContextualOwnerNote).not.toHaveBeenCalled()
}

describe('042 hybrid Category/POI access — AC-01-03 / BR-05', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetActiveLodgingContext.mockResolvedValue(null)
    mockGetDiscoveryCategory.mockResolvedValue(PUBLIC_CATEGORY)
    mockGetDiscoveryPoi.mockResolvedValue(PUBLIC_POI)
  })

  it.each([
    ['Category', () => CategoryPage(categoryProps), () => generateCategoryMetadata(categoryProps)],
    ['POI', () => PoiDetailPage(poiProps), () => generatePoiMetadata(poiProps)],
  ])('rejects a stale or cross-City cookie on the %s page and metadata before every content query', async (_label, renderPage, metadata) => {
    mockGetOptionalActiveLodgingContext.mockRejectedValue(ACCESS_DENIED)

    await expect(renderPage()).rejects.toThrow('REDIRECT:/acces-reserve')
    await expect(metadata()).rejects.toThrow('REDIRECT:/acces-reserve')

    expect(mockGetOptionalActiveLodgingContext).toHaveBeenCalledTimes(2)
    expect(mockGetOptionalActiveLodgingContext).toHaveBeenCalledWith(CITY_SLUG)
    expect(mockGetDiscoveryCategory).not.toHaveBeenCalled()
    expect(mockGetDiscoveryPoi).not.toHaveBeenCalled()
    expectNoPrivateQuery()
  })

  it('keeps anonymous eligible Category and POI pages on their permanent public redirects', async () => {
    mockGetOptionalActiveLodgingContext.mockResolvedValue(null)

    await expect(CategoryPage(categoryProps)).rejects.toThrow(
      `PERMANENT_REDIRECT:/decouvrir/${CITY_SLUG}/${CATEGORY_SLUG}`,
    )
    await expect(PoiDetailPage(poiProps)).rejects.toThrow(
      `PERMANENT_REDIRECT:/decouvrir/${CITY_SLUG}/${CATEGORY_SLUG}/${POI_SLUG}`,
    )

    expectNoPrivateQuery()
  })

  it('keeps anonymous ineligible Category and POI pages on 404', async () => {
    mockGetOptionalActiveLodgingContext.mockResolvedValue(null)
    mockGetDiscoveryCategory.mockResolvedValue(null)
    mockGetDiscoveryPoi.mockResolvedValue(null)

    await expect(CategoryPage(categoryProps)).rejects.toThrow('NOT_FOUND')
    await expect(PoiDetailPage(poiProps)).rejects.toThrow('NOT_FOUND')

    expectNoPrivateQuery()
  })
})
