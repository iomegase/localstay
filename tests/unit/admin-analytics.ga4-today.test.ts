import { generateKeyPairSync } from 'node:crypto'

import { fetchGoogleAnalyticsTodayMetrics } from '@/features/admin-analytics/services/google-analytics'

describe('030 google analytics today direct-read', () => {
  const originalFetch = global.fetch
  const originalPropertyId = process.env.GA4_PROPERTY_ID
  const originalServiceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const originalServiceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY

  beforeEach(() => {
    jest.clearAllMocks()

    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 1024 })

    process.env.GA4_PROPERTY_ID = '542429429'
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'sync-test@checkin-467416.iam.gserviceaccount.com'
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify(
      privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    )

    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url === 'https://oauth2.googleapis.com/token') {
        return new Response(
          JSON.stringify({
            access_token: 'token-456',
            token_type: 'Bearer',
            expires_in: 3600,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      if (url === 'https://analyticsdata.googleapis.com/v1beta/properties/542429429:runReport') {
        const body = JSON.parse(String(init?.body))

        expect(body.dateRanges).toEqual([{ startDate: 'today', endDate: 'today' }])
        expect(body.metrics).toEqual([
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'screenPageViews' },
          { name: 'engagementRate' },
        ])

        return new Response(
          JSON.stringify({
            rows: [
              {
                metricValues: [
                  { value: '42' },
                  { value: '35' },
                  { value: '88' },
                  { value: '0.64' },
                ],
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      throw new Error(`Unexpected fetch call: ${url}`)
    }) as typeof fetch
  })

  afterAll(() => {
    global.fetch = originalFetch

    if (originalPropertyId === undefined) delete process.env.GA4_PROPERTY_ID
    else process.env.GA4_PROPERTY_ID = originalPropertyId

    if (originalServiceAccountEmail === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    else process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = originalServiceAccountEmail

    if (originalServiceAccountKey === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    else process.env.GOOGLE_SERVICE_ACCOUNT_KEY = originalServiceAccountKey
  })

  it('reads same-day GA4 sessions, users, page views and engagement rate without persisting snapshots', async () => {
    const result = await fetchGoogleAnalyticsTodayMetrics()

    expect(result).toEqual({
      window_label: "Aujourd'hui",
      sessions: 42,
      users: 35,
      page_views: 88,
      engagement_rate: 0.64,
    })
  })
})
