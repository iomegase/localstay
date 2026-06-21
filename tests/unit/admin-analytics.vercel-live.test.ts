import { fetchVercelLiveMetrics } from '@/features/admin-analytics/services/vercel-live'

describe('030 vercel live metrics', () => {
  const originalFetch = global.fetch
  const originalProjectId = process.env.VERCEL_ANALYTICS_PROJECT_ID
  const originalEndpoint = process.env.VERCEL_ANALYTICS_LIVE_ENDPOINT
  const originalToken = process.env.VERCEL_ANALYTICS_LIVE_TOKEN

  beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.VERCEL_ANALYTICS_PROJECT_ID
    delete process.env.VERCEL_ANALYTICS_LIVE_ENDPOINT
    delete process.env.VERCEL_ANALYTICS_LIVE_TOKEN
  })

  afterAll(() => {
    global.fetch = originalFetch

    if (originalProjectId === undefined) delete process.env.VERCEL_ANALYTICS_PROJECT_ID
    else process.env.VERCEL_ANALYTICS_PROJECT_ID = originalProjectId

    if (originalEndpoint === undefined) delete process.env.VERCEL_ANALYTICS_LIVE_ENDPOINT
    else process.env.VERCEL_ANALYTICS_LIVE_ENDPOINT = originalEndpoint

    if (originalToken === undefined) delete process.env.VERCEL_ANALYTICS_LIVE_TOKEN
    else process.env.VERCEL_ANALYTICS_LIVE_TOKEN = originalToken
  })

  it('returns not_configured when no supported live endpoint is configured', async () => {
    process.env.VERCEL_ANALYTICS_PROJECT_ID = 'prj_test123'

    const result = await fetchVercelLiveMetrics()

    expect(result).toEqual({
      status: 'not_configured',
      window_label: null,
      visitors: null,
      page_views: null,
      top_pages: [],
      top_referrers: [],
    })
  })

  it('normalizes a supported live endpoint payload', async () => {
    process.env.VERCEL_ANALYTICS_PROJECT_ID = 'prj_test123'
    process.env.VERCEL_ANALYTICS_LIVE_ENDPOINT = 'https://metrics.example.com/vercel/live'
    process.env.VERCEL_ANALYTICS_LIVE_TOKEN = 'secret-123'

    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe('https://metrics.example.com/vercel/live')
      expect(init?.headers).toEqual({
        Authorization: 'Bearer secret-123',
      })

      return new Response(
        JSON.stringify({
          window_label: 'Last 30 minutes',
          visitors: 7,
          page_views: 11,
          top_pages: [{ page_path: '/guide/annecy', page_views: 5 }],
          top_referrers: [{ referrer: 'google.com', visitors: 3 }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }) as typeof fetch

    const result = await fetchVercelLiveMetrics()

    expect(result).toEqual({
      status: 'connected',
      window_label: 'Last 30 minutes',
      visitors: 7,
      page_views: 11,
      top_pages: [{ page_path: '/guide/annecy', page_views: 5 }],
      top_referrers: [{ referrer: 'google.com', visitors: 3 }],
    })
  })

  it('returns failed when the supported live endpoint responds with an error', async () => {
    process.env.VERCEL_ANALYTICS_PROJECT_ID = 'prj_test123'
    process.env.VERCEL_ANALYTICS_LIVE_ENDPOINT = 'https://metrics.example.com/vercel/live'

    global.fetch = jest.fn(async () => new Response('unavailable', { status: 503 })) as typeof fetch

    const result = await fetchVercelLiveMetrics()

    expect(result).toEqual({
      status: 'failed',
      window_label: null,
      visitors: null,
      page_views: null,
      top_pages: [],
      top_referrers: [],
    })
  })
})
