/**
 * Contract tests for POST /api/internal/gemini-fetch
 * Mocks runGeminiFetch to avoid real Gemini calls.
 */
import { NextRequest } from 'next/server'

// Mock the orchestrator
jest.mock('@/features/gemini-fetch/services/orchestrator', () => ({
  runGeminiFetch: jest.fn(),
}))

import { POST } from '@/app/api/internal/gemini-fetch/route'
import { runGeminiFetch } from '@/features/gemini-fetch/services/orchestrator'

const mockRun = runGeminiFetch as jest.MockedFunction<typeof runGeminiFetch>

function makeRequest(body: unknown, secret = 'test-secret'): NextRequest {
  return new NextRequest('http://localhost/api/internal/gemini-fetch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(body),
  })
}

beforeAll(() => {
  process.env.INTERNAL_API_SECRET = 'test-secret'
})

afterEach(() => jest.clearAllMocks())

describe('POST /api/internal/gemini-fetch', () => {
  it('returns 401 without valid Bearer token', async () => {
    const req = makeRequest({ city_id: 'c1', category_id: 'cat1' }, 'wrong')
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 with missing city_id', async () => {
    const req = makeRequest({ category_id: 'cat1' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 with missing category_id', async () => {
    const req = makeRequest({ city_id: 'c1' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 with fetched result', async () => {
    mockRun.mockResolvedValueOnce({
      status: 'fetched',
      poi_count: 5,
      expires_at: new Date().toISOString(),
    })
    const req = makeRequest({ city_id: 'c1', category_id: 'cat1' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.data.status).toBe('fetched')
    expect(data.data.poi_count).toBe(5)
  })

  it('returns 200 with cached result when lock held', async () => {
    mockRun.mockResolvedValueOnce({ status: 'cached', poi_count: 3 })
    const req = makeRequest({ city_id: 'c1', category_id: 'cat1' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.data.status).toBe('cached')
  })

  it('calls runGeminiFetch with force_refresh when provided', async () => {
    mockRun.mockResolvedValueOnce({ status: 'fetched', poi_count: 2 })
    const req = makeRequest({ city_id: 'c1', category_id: 'cat1', force_refresh: true })
    await POST(req)
    expect(mockRun).toHaveBeenCalledWith({
      cityId: 'c1',
      categoryId: 'cat1',
      forceRefresh: true,
    })
  })
})
