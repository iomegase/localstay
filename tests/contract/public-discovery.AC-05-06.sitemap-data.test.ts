const mockPoiFindMany = jest.fn()
const mockLodgingFindMany = jest.fn()
const mockBlogFindMany = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    pointOfInterest: { findMany: (...args: unknown[]) => mockPoiFindMany(...args) },
    lodgingPublicProfile: { findMany: (...args: unknown[]) => mockLodgingFindMany(...args) },
    blogArticle: { findMany: (...args: unknown[]) => mockBlogFindMany(...args) },
  },
}))

import { getSitemapData } from '@/features/seo/queries/sitemap-data'

function visiblePoi(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Le Sérac',
    slug: 'le-serac',
    description: 'Une adresse locale vérifiée.',
    address: '1 rue du Mont-Blanc',
    latitude: 45.8921,
    longitude: 6.7085,
    phone: '+33 4 50 00 00 00',
    website: null,
    photos: ['https://images.example.com/le-serac.jpg'],
    discovery_status: 'PUBLISHED',
    discovery_published_at: new Date('2026-08-18T09:00:00Z'),
    is_active: true,
    deleted_at: null,
    geocode_status: 'success',
    subcategory_id: null,
    city: {
      slug: 'saint-gervais-les-bains',
      latitude: 45.8921,
      longitude: 6.7085,
      is_active: true,
      deleted_at: null,
    },
    category: {
      id: 'category-diner',
      slug: 'diner',
      is_active: true,
      deleted_at: null,
    },
    subcategory: null,
    ...overrides,
  }
}

describe('041 AC-05-06 sitemap data contract', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPoiFindMany.mockResolvedValue([])
    mockLodgingFindMany.mockResolvedValue([])
    mockBlogFindMany.mockResolvedValue([])
  })

  it('filters POIs with the complete BR-08 visibility predicate and a public-only select', async () => {
    await getSitemapData()

    expect(mockPoiFindMany).toHaveBeenCalledWith({
      where: {
        discovery_status: 'PUBLISHED',
        discovery_published_at: { not: null },
        is_active: true,
        deleted_at: null,
        geocode_status: 'success',
        city: { is_active: true, deleted_at: null },
        category: { is_active: true, deleted_at: null },
        OR: [
          { subcategory_id: null },
          { subcategory: { is: { is_active: true, deleted_at: null } } },
        ],
      },
      select: {
        name: true,
        slug: true,
        description: true,
        address: true,
        latitude: true,
        longitude: true,
        phone: true,
        website: true,
        photos: true,
        discovery_status: true,
        discovery_published_at: true,
        is_active: true,
        deleted_at: true,
        geocode_status: true,
        subcategory_id: true,
        city: {
          select: {
            slug: true,
            latitude: true,
            longitude: true,
            is_active: true,
            deleted_at: true,
          },
        },
        category: {
          select: {
            id: true,
            slug: true,
            is_active: true,
            deleted_at: true,
          },
        },
        subcategory: {
          select: {
            category_id: true,
            is_active: true,
            deleted_at: true,
          },
        },
      },
    })
  })

  it('derives deterministic public DTOs without incomplete discovery timestamps', async () => {
    mockPoiFindMany.mockResolvedValue([
      visiblePoi(),
      visiblePoi({
        slug: 'la-table-alpine',
      }),
    ])

    const result = await getSitemapData()

    expect(result.cities).toEqual([
      { slug: 'saint-gervais-les-bains' },
    ])
    expect(result.pois).toEqual([
      {
        slug: 'la-table-alpine',
        city_slug: 'saint-gervais-les-bains',
        category_slug: 'diner',
      },
      {
        slug: 'le-serac',
        city_slug: 'saint-gervais-les-bains',
        category_slug: 'diner',
      },
    ])
  })

  it('drops stale PUBLISHED rows that are not actually visible on public pages', async () => {
    const inactiveCity = { ...visiblePoi().city, is_active: false }
    const deletedCity = { ...visiblePoi().city, deleted_at: new Date('2026-08-20T00:00:00Z') }
    const invalidCityCenter = { ...visiblePoi().city, longitude: Number.POSITIVE_INFINITY }
    const inactiveCategory = { ...visiblePoi().category, is_active: false }
    const deletedCategory = { ...visiblePoi().category, deleted_at: new Date('2026-08-20T00:00:00Z') }
    const inactiveSubcategory = {
      category_id: 'category-diner', is_active: false, deleted_at: null,
    }
    const mismatchedSubcategory = {
      category_id: 'another-category', is_active: true, deleted_at: null,
    }
    const deletedSubcategory = {
      category_id: 'category-diner', is_active: true,
      deleted_at: new Date('2026-08-20T00:00:00Z'),
    }
    const farAwayLongitude = 7.1

    mockPoiFindMany.mockResolvedValue([
      visiblePoi(),
      visiblePoi({ slug: 'draft', discovery_status: 'DRAFT' }),
      visiblePoi({ slug: 'missing-publication-date', discovery_published_at: null }),
      visiblePoi({ slug: 'inactive-poi', is_active: false }),
      visiblePoi({ slug: 'deleted-poi', deleted_at: new Date('2026-08-20T00:00:00Z') }),
      visiblePoi({ slug: 'missing-description', description: ' ' }),
      visiblePoi({ slug: 'missing-photo', photos: [] }),
      visiblePoi({ slug: 'invalid-photo', photos: ['javascript:alert(1)'] }),
      visiblePoi({ slug: 'missing-address', address: ' ' }),
      visiblePoi({ slug: 'missing-contact', phone: ' ', website: 'ftp://example.com' }),
      visiblePoi({ slug: 'bad-geocode', geocode_status: 'failed' }),
      visiblePoi({ slug: 'bad-coordinate', latitude: Number.NaN }),
      visiblePoi({ slug: 'inactive-city', city: inactiveCity }),
      visiblePoi({ slug: 'deleted-city', city: deletedCity }),
      visiblePoi({ slug: 'invalid-city-center', city: invalidCityCenter }),
      visiblePoi({ slug: 'inactive-category', category: inactiveCategory }),
      visiblePoi({ slug: 'deleted-category', category: deletedCategory }),
      visiblePoi({
        slug: 'inactive-subcategory', subcategory_id: 'sub-1', subcategory: inactiveSubcategory,
      }),
      visiblePoi({ slug: 'missing-subcategory', subcategory_id: 'sub-1', subcategory: null }),
      visiblePoi({
        slug: 'deleted-subcategory', subcategory_id: 'sub-1', subcategory: deletedSubcategory,
      }),
      visiblePoi({
        slug: 'mismatched-subcategory', subcategory_id: 'sub-1', subcategory: mismatchedSubcategory,
      }),
      visiblePoi({ slug: 'bad Poi slug' }),
      visiblePoi({
        slug: 'bad-city-slug', city: { ...visiblePoi().city, slug: 'Saint Gervais' },
      }),
      visiblePoi({
        slug: 'bad-category-slug', category: { ...visiblePoi().category, slug: 'À table' },
      }),
      visiblePoi({ slug: 'too-far', longitude: farAwayLongitude }),
    ])

    const result = await getSitemapData()

    expect(result.pois).toEqual([
      {
        slug: 'le-serac',
        city_slug: 'saint-gervais-les-bains',
        category_slug: 'diner',
      },
    ])
    expect(result.cities).toEqual([
      { slug: 'saint-gervais-les-bains' },
    ])
  })

  it('keeps the published lodging and blog contracts unchanged', async () => {
    await getSitemapData()

    expect(mockLodgingFindMany).toHaveBeenCalledWith({
      where: {
        publication_status: 'published',
        deleted_at: null,
        city: { is_active: true, deleted_at: null },
        lodging: { is_active: true, deleted_at: null },
      },
      select: {
        slug: true,
        updated_at: true,
        city: { select: { slug: true } },
      },
    })
    expect(mockBlogFindMany).toHaveBeenCalledWith({
      where: {
        status: 'published',
        deleted_at: null,
        NOT: { published_at: null },
      },
      select: { slug: true, updated_at: true },
    })
  })
})
