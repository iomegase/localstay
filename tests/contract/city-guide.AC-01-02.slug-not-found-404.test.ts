import { GET } from '@/app/api/cities/[slug]/route'
import { NextRequest } from 'next/server'

jest.mock('@/features/city-guide/queries/cities', () => ({
  getCityGuide: jest.fn().mockResolvedValue(null),
}))

describe('GET /api/cities/[slug] — 404 branch (AC-01-02)', () => {
  it('returns 404 with CITY_NOT_FOUND code when slug does not exist', async () => {
    const req = new NextRequest('http://localhost/api/cities/nonexistent-city')
    const res = await GET(req, { params: { slug: 'nonexistent-city' } })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error.code).toBe('CITY_NOT_FOUND')
    expect(typeof body.error.message).toBe('string')
  })

  it('error response shape matches spec 001 Error schema', async () => {
    const req = new NextRequest('http://localhost/api/cities/nonexistent')
    const res = await GET(req, { params: { slug: 'nonexistent' } })
    const body = await res.json()
    expect(body).toHaveProperty('error')
    expect(body.error).toHaveProperty('code')
    expect(body.error).toHaveProperty('message')
  })
})
