import { GET } from '@/app/api/cities/[slug]/categories/[category-slug]/route'
import { NextRequest } from 'next/server'
import type { CategoryDetail } from '@/features/categories/types'

jest.mock('@/features/categories/queries/categories', () => ({
  getCategoriesForCity: jest.fn(),
  getCategoryDetail: jest.fn(),
  getPoisForCategory: jest.fn(),
}))

import { getCategoryDetail } from '@/features/categories/queries/categories'
const mockGetDetail = getCategoryDetail as jest.Mock

const mockDetail: CategoryDetail = {
  id: '1', name: 'Restaurants', slug: 'restaurants', icon: 'utensils', sort_order: 1, poi_count: 2,
  subcategories: [
    { id: 'sub1', name: 'Gastronomique', slug: 'gastronomique', poi_count: 1 },
    { id: 'sub2', name: 'Snacking', slug: 'snacking', poi_count: 1 },
  ],
}

describe('GET /api/cities/[slug]/categories/[category-slug] — contract (AC-02-01)', () => {
  it('returns 200 with category detail and subcategories', async () => {
    mockGetDetail.mockResolvedValue(mockDetail)
    const req = new NextRequest('http://localhost/api/cities/saint-gervais-les-bains/categories/restaurants')
    const res = await GET(req, { params: { slug: 'saint-gervais-les-bains', 'category-slug': 'restaurants' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.slug).toBe('restaurants')
    expect(body.data.subcategories).toHaveLength(2)
    expect(body.data.subcategories[0].poi_count).toBeGreaterThanOrEqual(1)
  })

  it('returns 404 with NOT_FOUND when category does not exist', async () => {
    mockGetDetail.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/cities/saint-gervais-les-bains/categories/unknown')
    const res = await GET(req, { params: { slug: 'saint-gervais-les-bains', 'category-slug': 'unknown' } })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error.code).toBe('NOT_FOUND')
    expect(typeof body.error.message).toBe('string')
  })
})
