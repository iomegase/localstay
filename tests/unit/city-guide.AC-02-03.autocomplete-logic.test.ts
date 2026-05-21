import { GET } from '@/app/api/cities/search/route'
import { NextRequest } from 'next/server'

jest.mock('@/features/city-guide/queries/cities', () => ({
  searchCities: jest.fn().mockResolvedValue([]),
}))

describe('GET /api/cities/search', () => {
  it('AC-02-03: returns 400 when q is missing', async () => {
    const req = new NextRequest('http://localhost/api/cities/search')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('QUERY_TOO_SHORT')
  })

  it('AC-02-03: returns 400 when q is shorter than 3 characters', async () => {
    const req = new NextRequest('http://localhost/api/cities/search?q=ab')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('QUERY_TOO_SHORT')
  })

  it('AC-02-03: returns 200 with data array when q is exactly 3 chars', async () => {
    const req = new NextRequest('http://localhost/api/cities/search?q=sai')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.data)).toBe(true)
  })

  it('AC-02-03: returns 200 with data array when q is longer than 3 chars', async () => {
    const req = new NextRequest('http://localhost/api/cities/search?q=saint')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.data)).toBe(true)
  })
})
