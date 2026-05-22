import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../../src/app/api/internal/geocode-pois/route'
import { NextRequest } from 'next/server'

vi.mock('../../src/features/geocoding/services/geocode-runner', () => ({
  runGeocodeBatch: vi.fn().mockResolvedValue({
    geocoded: 3,
    failed: 1,
    rejected: 0,
    skipped: 6,
  }),
}))

function makeRequest(body: unknown = {}, token = 'test-secret'): NextRequest {
  return new NextRequest('http://localhost:3000/api/internal/geocode-pois', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/internal/geocode-pois', () => {
  beforeEach(() => {
    vi.stubEnv('INTERNAL_API_SECRET', 'test-secret')
  })

  it('returns 401 when Authorization header is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/internal/geocode-pois', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 when token is wrong', async () => {
    const req = makeRequest({}, 'wrong-token')
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 200 with BatchResult on empty body', async () => {
    const req = makeRequest({})
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toEqual({ geocoded: 3, failed: 1, rejected: 0, skipped: 6 })
  })

  it('returns 200 with city_id and custom limit', async () => {
    const req = makeRequest({ city_id: 'abc', limit: 5 })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('returns 400 when limit exceeds max (50)', async () => {
    const req = makeRequest({ limit: 999 })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
