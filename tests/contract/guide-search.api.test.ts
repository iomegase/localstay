const mockSearchGuide = jest.fn()
jest.mock('@/features/city-guide/queries/cities', () => ({
  searchGuide: (...args: unknown[]) => mockSearchGuide(...args),
}))

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/cities/[slug]/search/route'

function makeReq(q: string) {
  return new NextRequest(`http://localhost/api/cities/saint-gervais/search?q=${encodeURIComponent(q)}`)
}
const params = () => ({ params: Promise.resolve({ slug: 'saint-gervais' }) })

describe('GET /api/cities/[slug]/search', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 400 when q is shorter than 2 characters', async () => {
    const res = await GET(makeReq('a'), params())
    expect(res.status).toBe(400)
    expect(mockSearchGuide).not.toHaveBeenCalled()
  })

  it('returns 200 with { data } and calls searchGuide(slug, q) for a valid query', async () => {
    mockSearchGuide.mockResolvedValue({
      pois: [{ id: 'p1', name: 'Pizzeria', slug: 'pizzeria', category_slug: 'restaurants', subcategory_name: null, photo: null }],
      categories: [{ name: 'Restaurants', slug: 'restaurants' }],
    })

    const res = await GET(makeReq('piz'), params())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.pois).toHaveLength(1)
    expect(json.data.categories).toHaveLength(1)
    expect(mockSearchGuide).toHaveBeenCalledWith('saint-gervais', 'piz')
  })
})
