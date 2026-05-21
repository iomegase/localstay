import { GET } from '@/app/api/cities/[slug]/route'
import { NextRequest } from 'next/server'

jest.mock('@/features/city-guide/queries/cities', () => ({
  getCityGuide: jest.fn().mockResolvedValue({
    city: { id: 'city-1', name: 'Testville', slug: 'testville', postal_code: '00000', department: null },
    categories: [],
  }),
}))

describe('GET /api/cities/[slug] — empty state (AC-03-04)', () => {
  it('returns 200 with empty categories array when city has no active POIs', async () => {
    const req = new NextRequest('http://localhost/api/cities/testville')
    const res = await GET(req, { params: { slug: 'testville' } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.categories).toEqual([])
    expect(body.data.city.slug).toBe('testville')
  })

  it('response shape matches spec 001 CityGuide schema', async () => {
    const req = new NextRequest('http://localhost/api/cities/testville')
    const res = await GET(req, { params: { slug: 'testville' } })
    const body = await res.json()
    expect(body.data).toHaveProperty('city')
    expect(body.data).toHaveProperty('categories')
    expect(body.data.city).toHaveProperty('id')
    expect(body.data.city).toHaveProperty('name')
    expect(body.data.city).toHaveProperty('slug')
    expect(body.data.city).toHaveProperty('postal_code')
    expect(Array.isArray(body.data.categories)).toBe(true)
  })
})
