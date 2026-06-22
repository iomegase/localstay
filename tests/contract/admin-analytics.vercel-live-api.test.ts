import { NextRequest } from 'next/server'

const mockGetInternalVercelLiveBlock = jest.fn()

jest.mock('@/features/admin-analytics/services/vercel-live-aggregate', () => ({
  getInternalVercelLiveBlock: function() {
    return mockGetInternalVercelLiveBlock.apply(this, arguments as never)
  },
}))

import { GET } from '@/app/api/internal/analytics/vercel-live/route'

const TOKEN = 'vercel-live-token'

function makeRequest(token = TOKEN): NextRequest {
  return new NextRequest('http://localhost/api/internal/analytics/vercel-live', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

describe('GET /api/internal/analytics/vercel-live', () => {
  const previousToken = process.env.VERCEL_ANALYTICS_LIVE_TOKEN

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.VERCEL_ANALYTICS_LIVE_TOKEN = TOKEN
    mockGetInternalVercelLiveBlock.mockResolvedValue({
      status: 'connected',
      window_label: 'Last 30 minutes',
      visitors: 2,
      page_views: 3,
      top_pages: [{ page_path: '/guide/annecy', page_views: 2 }],
      top_referrers: [{ referrer: 'google.com', visitors: 1 }],
    })
  })

  afterAll(() => {
    if (previousToken === undefined) delete process.env.VERCEL_ANALYTICS_LIVE_TOKEN
    else process.env.VERCEL_ANALYTICS_LIVE_TOKEN = previousToken
  })

  it('AC-05-06: returns the recent live block behind the expected bearer token', async () => {
    const res = await GET(makeRequest(TOKEN))

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      status: 'connected',
      window_label: 'Last 30 minutes',
      visitors: 2,
      page_views: 3,
      top_pages: [{ page_path: '/guide/annecy', page_views: 2 }],
      top_referrers: [{ referrer: 'google.com', visitors: 1 }],
    })
    expect(mockGetInternalVercelLiveBlock).toHaveBeenCalledTimes(1)
  })

  it('BR-30: rejects requests with an invalid live token', async () => {
    const res = await GET(makeRequest('wrong-token'))

    expect(res.status).toBe(401)
    expect(mockGetInternalVercelLiveBlock).not.toHaveBeenCalled()
  })
})
