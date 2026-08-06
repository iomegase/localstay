const mockGetActiveLodgingContext = jest.fn()
const mockGetBlogBySlug = jest.fn()
const mockGetLodgingDetail = jest.fn()

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: () => mockGetActiveLodgingContext(),
}))
jest.mock('@/features/blog/queries/public-blog', () => ({
  getPublishedBlogArticleBySlug: (...a: unknown[]) => mockGetBlogBySlug(...a),
}))
jest.mock('@/features/lodging-showcase/queries/public-lodgings', () => ({
  getPublishedLodgingDetail: (...a: unknown[]) => mockGetLodgingDetail(...a),
}))
jest.mock('@/features/blog/lib/category-label', () => ({
  blogCategoryLabel: () => 'Inspirations',
}))

import { GET as GET_BLOG } from '@/app/api/internal/guide/blog/[slug]/route'
import { GET as GET_LODGING } from '@/app/api/internal/guide/lodging/[slug]/route'

const ACTIVE = { lodgingId: 'l1', citySlug: 'saint-gervais' }

beforeEach(() => {
  jest.clearAllMocks()
  mockGetActiveLodgingContext.mockResolvedValue(ACTIVE)
})

describe('GET /api/internal/guide/blog/[slug]', () => {
  const ctx = { params: Promise.resolve({ slug: 'un-article' }) }

  it('denies without an active stay (confinement)', async () => {
    mockGetActiveLodgingContext.mockResolvedValue(null)
    const res = await GET_BLOG(new Request('http://x'), ctx)
    expect(res.status).toBe(403)
    expect(mockGetBlogBySlug).not.toHaveBeenCalled()
  })

  it('returns 404 when the article is missing', async () => {
    mockGetBlogBySlug.mockResolvedValue(null)
    const res = await GET_BLOG(new Request('http://x'), ctx)
    expect(res.status).toBe(404)
  })

  it('returns the mapped article detail', async () => {
    mockGetBlogBySlug.mockResolvedValue({
      title: 'Un article',
      category: 'inspiration',
      city: { name: 'Saint-Gervais' },
      cover: { url: 'https://cdn/x.jpg' },
      content_markdown: '# Bonjour',
    })
    const res = await GET_BLOG(new Request('http://x'), ctx)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      title: 'Un article',
      categoryLabel: 'Inspirations',
      cityName: 'Saint-Gervais',
      coverUrl: 'https://cdn/x.jpg',
      contentMarkdown: '# Bonjour',
    })
  })
})

describe('GET /api/internal/guide/lodging/[slug]', () => {
  const ctx = { params: Promise.resolve({ slug: 'chalet-remy' }) }

  it('denies without an active stay (confinement)', async () => {
    mockGetActiveLodgingContext.mockResolvedValue(null)
    const res = await GET_LODGING(new Request('http://x?city=saint-gervais'), ctx)
    expect(res.status).toBe(403)
  })

  it('returns 400 without a city query', async () => {
    const res = await GET_LODGING(new Request('http://x'), ctx)
    expect(res.status).toBe(400)
    expect(mockGetLodgingDetail).not.toHaveBeenCalled()
  })

  it('returns 404 when the lodging is missing', async () => {
    mockGetLodgingDetail.mockResolvedValue(null)
    const res = await GET_LODGING(new Request('http://x?city=saint-gervais'), ctx)
    expect(res.status).toBe(404)
    expect(mockGetLodgingDetail).toHaveBeenCalledWith('saint-gervais', 'chalet-remy')
  })

  it('returns the mapped lodging detail', async () => {
    mockGetLodgingDetail.mockResolvedValue({
      title: 'Chalet Rémy',
      city_name: 'Saint-Gervais',
      property_type: 'Chalet',
      description: 'Beau chalet',
      max_guests: 6,
      bedroom_count: 3,
      bathroom_count: 2,
      surface_m2: 120,
      photos: [{ url: 'https://cdn/a.jpg', alt: 'a', room_type: null }],
      amenities_included: ['Wifi'],
      amenities_on_request: ['Ménage'],
    })
    const res = await GET_LODGING(new Request('http://x?city=saint-gervais'), ctx)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      title: 'Chalet Rémy',
      cityName: 'Saint-Gervais',
      propertyType: 'Chalet',
      description: 'Beau chalet',
      maxGuests: 6,
      photos: [{ url: 'https://cdn/a.jpg', alt: 'a' }],
      amenitiesIncluded: ['Wifi'],
      amenitiesOnRequest: ['Ménage'],
    })
  })
})
