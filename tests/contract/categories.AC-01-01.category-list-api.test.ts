import { GET } from '@/app/api/cities/[slug]/categories/route'
import { NextRequest } from 'next/server'
import type { CategoryWithCount } from '@/features/categories/types'

jest.mock('@/features/categories/queries/categories', () => ({
  getCategoriesForCity: jest.fn(),
  getCategoryDetail: jest.fn(),
  getPoisForCategory: jest.fn(),
}))

import { getCategoriesForCity } from '@/features/categories/queries/categories'
const mockGet = getCategoriesForCity as jest.Mock

const mockCategories: CategoryWithCount[] = [
  { id: '1', name: 'Restaurants', slug: 'restaurants', icon: 'utensils', sort_order: 1, poi_count: 3 },
]

describe('GET /api/cities/[slug]/categories — contract (AC-01-01)', () => {
  it('returns 200 with category array when city exists', async () => {
    mockGet.mockResolvedValue(mockCategories)
    const req = new NextRequest('http://localhost/api/cities/saint-gervais-les-bains/categories')
    const res = await GET(req, { params: { slug: 'saint-gervais-les-bains' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual(mockCategories)
    expect(body.data[0].poi_count).toBeGreaterThanOrEqual(1)
  })

  it('returns 404 with CITY_NOT_FOUND when city does not exist', async () => {
    mockGet.mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/cities/unknown/categories')
    const res = await GET(req, { params: { slug: 'unknown' } })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error.code).toBe('CITY_NOT_FOUND')
    expect(typeof body.error.message).toBe('string')
  })
})
