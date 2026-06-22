import { NextRequest } from 'next/server'

const mockIngestVercelDrainPayload = jest.fn()

jest.mock('@/features/admin-analytics/services/vercel-drain', () => ({
  ingestVercelDrainPayload: function() {
    return mockIngestVercelDrainPayload.apply(this, arguments as never)
  },
}))

import { POST } from '@/app/api/internal/analytics/vercel-drain/route'

const SECRET = 'vercel-drain-secret'

function makeRequest(token = SECRET, body?: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/internal/analytics/vercel-drain?token=${token}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/internal/analytics/vercel-drain', () => {
  const previousSecret = process.env.VERCEL_ANALYTICS_DRAIN_SECRET

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.VERCEL_ANALYTICS_DRAIN_SECRET = SECRET
    mockIngestVercelDrainPayload.mockResolvedValue({ ingested: 1 })
  })

  afterAll(() => {
    if (previousSecret === undefined) delete process.env.VERCEL_ANALYTICS_DRAIN_SECRET
    else process.env.VERCEL_ANALYTICS_DRAIN_SECRET = previousSecret
  })

  it('AC-05-07: ingests a valid Vercel drain payload behind the expected secret', async () => {
    const payload = {
      schema: 'vercel.analytics.v2',
      eventType: 'pageview',
      timestamp: 1718870400000,
      projectId: 'prj_test123',
      ownerId: 'team_test123',
      sessionId: 12345,
      deviceId: 67890,
      origin: 'https://mystay.city',
      path: '/guide/annecy',
      referrer: 'google.com',
    }

    const res = await POST(makeRequest(SECRET, payload))

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      status: 'ok',
      ingested: 1,
    })
    expect(mockIngestVercelDrainPayload).toHaveBeenCalledWith([
      expect.objectContaining({
        eventType: 'pageview',
        path: '/guide/annecy',
      }),
    ])
  })

  it('BR-29: rejects requests with an invalid drain secret', async () => {
    const res = await POST(makeRequest('wrong-secret', {
      schema: 'vercel.analytics.v2',
      eventType: 'pageview',
      timestamp: 1718870400000,
      projectId: 'prj_test123',
    }))

    expect(res.status).toBe(401)
    expect(mockIngestVercelDrainPayload).not.toHaveBeenCalled()
  })

  it('BR-20: rejects malformed Vercel drain payloads', async () => {
    const res = await POST(makeRequest(SECRET, { eventType: 'pageview' }))

    expect(res.status).toBe(400)
    expect(mockIngestVercelDrainPayload).not.toHaveBeenCalled()
  })
})
