const mockGetAllPoiCards = jest.fn()
jest.mock('@/features/categories/queries/all-poi-cards', () => ({
  getAllPoiCards: (...args: unknown[]) => mockGetAllPoiCards(...args),
}))

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/cities/[slug]/pois/route'

const params = () => ({ params: Promise.resolve({ slug: 'saint-gervais' }) })
function makeReq(qs = '') {
  return new NextRequest(`http://localhost/api/cities/saint-gervais/pois${qs}`)
}

describe('GET /api/cities/[slug]/pois — tous les POI paginés', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 200 with items + meta and default page=1 / limit=10 / sort=distance', async () => {
    mockGetAllPoiCards.mockResolvedValue({
      items: [{ id: 'p1' }],
      meta: { page: 1, limit: 10, total: 1, total_pages: 1 },
    })
    const res = await GET(makeReq(), params())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.meta.limit).toBe(10)
    expect(mockGetAllPoiCards).toHaveBeenCalledWith('saint-gervais', { sort: 'distance', page: 1, limit: 10 })
  })

  it('passes lodging id to the all-POI query when present', async () => {
    mockGetAllPoiCards.mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 10, total: 0, total_pages: 0 },
    })

    await GET(makeReq('?lodging=550e8400-e29b-41d4-a716-446655440000'), params())

    expect(mockGetAllPoiCards).toHaveBeenCalledWith('saint-gervais', {
      sort: 'distance',
      page: 1,
      limit: 10,
      lodgingId: '550e8400-e29b-41d4-a716-446655440000',
    })
  })

  it('parses page, limit and sort from the query string', async () => {
    mockGetAllPoiCards.mockResolvedValue({ items: [], meta: { page: 2, limit: 10, total: 0, total_pages: 0 } })
    await GET(makeReq('?page=2&limit=10&sort=rating'), params())
    expect(mockGetAllPoiCards).toHaveBeenCalledWith('saint-gervais', { sort: 'rating', page: 2, limit: 10 })
  })

  it('returns 404 when the city does not exist', async () => {
    mockGetAllPoiCards.mockResolvedValue(null)
    const res = await GET(makeReq(), params())
    expect(res.status).toBe(404)
  })
})
