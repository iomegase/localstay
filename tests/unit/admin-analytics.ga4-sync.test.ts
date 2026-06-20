import { generateKeyPairSync } from 'node:crypto'

const mockFindCities = jest.fn()
const mockUpsertDailySnapshot = jest.fn()
const mockUpsertPageSnapshot = jest.fn()
const mockUpsertCitySnapshot = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: {
      findMany: (...args: unknown[]) => mockFindCities(...args),
    },
    analyticsDailySnapshot: {
      upsert: (...args: unknown[]) => mockUpsertDailySnapshot(...args),
    },
    analyticsPageDailySnapshot: {
      upsert: (...args: unknown[]) => mockUpsertPageSnapshot(...args),
    },
    analyticsCityDailySnapshot: {
      upsert: (...args: unknown[]) => mockUpsertCitySnapshot(...args),
    },
  },
}))

import { syncGoogleAnalyticsSource } from '@/features/admin-analytics/services/google-analytics'

describe('030 google analytics sync', () => {
  const originalFetch = global.fetch
  const originalDateNow = Date.now
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

    Date.now = jest.fn(() => new Date('2026-06-20T10:00:00.000Z').getTime())

    mockFindCities.mockResolvedValue([{ id: 'city-annecy', slug: 'annecy' }])
    mockUpsertDailySnapshot.mockResolvedValue({})
    mockUpsertPageSnapshot.mockResolvedValue({})
    mockUpsertCitySnapshot.mockResolvedValue({})

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
        const dimensions = Array.isArray(body.dimensions) ? body.dimensions.map((item: { name: string }) => item.name).join(',') : ''

        if (dimensions === 'date') {
          return new Response(
            JSON.stringify({
              rows: [
                {
                  dimensionValues: [{ value: '20260619' }],
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

        if (dimensions === 'date,pagePath') {
          return new Response(
            JSON.stringify({
              rows: [
                {
                  dimensionValues: [{ value: '20260619' }, { value: '/guide/annecy' }],
                  metricValues: [
                    { value: '20' },
                    { value: '18' },
                    { value: '40' },
                    { value: '0.70' },
                  ],
                },
                {
                  dimensionValues: [{ value: '20260619' }, { value: '/guide/annecy/contact' }],
                  metricValues: [
                    { value: '8' },
                    { value: '7' },
                    { value: '12' },
                    { value: '0.55' },
                  ],
                },
                {
                  dimensionValues: [{ value: '20260619' }, { value: '/blog/seo-local' }],
                  metricValues: [
                    { value: '4' },
                    { value: '4' },
                    { value: '9' },
                    { value: '0.50' },
                  ],
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }
      }

      throw new Error(`Unexpected fetch call: ${url}`)
    }) as typeof fetch
  })

  afterAll(() => {
    global.fetch = originalFetch
    Date.now = originalDateNow

    if (originalPropertyId === undefined) delete process.env.GA4_PROPERTY_ID
    else process.env.GA4_PROPERTY_ID = originalPropertyId

    if (originalServiceAccountEmail === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    else process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = originalServiceAccountEmail

    if (originalServiceAccountKey === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    else process.env.GOOGLE_SERVICE_ACCOUNT_KEY = originalServiceAccountKey
  })

  it('imports GA4 daily, page and city snapshots from Analytics Data API rows', async () => {
    const result = await syncGoogleAnalyticsSource()

    expect(result).toEqual({
      period_start: '2026-05-21',
      period_end: '2026-06-19',
      daily_rows: 1,
      page_rows: 3,
      city_rows: 1,
    })

    expect(mockUpsertDailySnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          snapshot_date: new Date('2026-06-19T00:00:00.000Z'),
        },
        update: expect.objectContaining({
          sessions: 42,
          users: 35,
          page_views: 88,
          engagement_rate: 0.64,
        }),
      }),
    )

    expect(mockUpsertPageSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          snapshot_date_page_path: {
            snapshot_date: new Date('2026-06-19T00:00:00.000Z'),
            page_path: '/guide/annecy',
          },
        },
        update: expect.objectContaining({
          page_type: 'city_guide',
          city_id: 'city-annecy',
          sessions: 20,
          users: 18,
          page_views: 40,
        }),
      }),
    )

    expect(mockUpsertCitySnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          snapshot_date_city_id: {
            snapshot_date: new Date('2026-06-19T00:00:00.000Z'),
            city_id: 'city-annecy',
          },
        },
        update: expect.objectContaining({
          sessions: 28,
          users: 25,
          page_views: 52,
        }),
      }),
    )
  })
})
