import { NextRequest } from 'next/server'

const mockRunAdminAnalyticsSync = jest.fn()

jest.mock('@/features/admin-analytics/services/sync', () => ({
  runAdminAnalyticsSync: function() {
    return mockRunAdminAnalyticsSync.apply(this, arguments as never)
  },
}))

import { POST } from '@/app/api/internal/analytics/sync/route'

const SECRET = 'test-internal-secret'

function makeRequest(token = SECRET, body?: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/internal/analytics/sync', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('POST /api/internal/analytics/sync', () => {
  const previousSecret = process.env.INTERNAL_API_SECRET

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.INTERNAL_API_SECRET = SECRET
    mockRunAdminAnalyticsSync.mockResolvedValue({
      status: 'partial',
      synced_sources: ['ga4', 'gsc'],
    })
  })

  afterAll(() => {
    if (previousSecret === undefined) {
      delete process.env.INTERNAL_API_SECRET
      return
    }

    process.env.INTERNAL_API_SECRET = previousSecret
  })

  it('AC-05-01/05-02: triggers a consolidated sync and returns its summary', async () => {
    const res = await POST(makeRequest(SECRET, { source: 'all' }))

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      status: 'partial',
      synced_sources: ['ga4', 'gsc'],
    })
    expect(mockRunAdminAnalyticsSync).toHaveBeenCalledWith({ source: 'all' })
  })

  it('AC-05-04: rejects requests with an invalid secret', async () => {
    const res = await POST(makeRequest('wrong-secret', { source: 'all' }))

    expect(res.status).toBe(401)
    expect(mockRunAdminAnalyticsSync).not.toHaveBeenCalled()
  })

  it('BR-20: validates the optional source filter', async () => {
    const res = await POST(makeRequest(SECRET, { source: 'invalid-source' }))

    expect(res.status).toBe(400)
    expect(mockRunAdminAnalyticsSync).not.toHaveBeenCalled()
  })
})
