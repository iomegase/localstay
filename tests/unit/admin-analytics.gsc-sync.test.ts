import { generateKeyPairSync } from 'node:crypto'

const mockFindCities = jest.fn()
const mockUpsertDailySnapshot = jest.fn()
const mockUpsertPageSnapshot = jest.fn()
const mockUpsertQuerySnapshot = jest.fn()
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
    analyticsQueryDailySnapshot: {
      upsert: (...args: unknown[]) => mockUpsertQuerySnapshot(...args),
    },
    analyticsCityDailySnapshot: {
      upsert: (...args: unknown[]) => mockUpsertCitySnapshot(...args),
    },
  },
}))

import { syncGoogleSearchConsoleSource } from '@/features/admin-analytics/services/google-search-console'

describe('030 google search console sync', () => {
  const originalFetch = global.fetch
  const originalDateNow = Date.now
  const originalPropertyId = process.env.GSC_SITE_URL
  const originalServiceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const originalServiceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY

  beforeEach(() => {
    jest.clearAllMocks()

    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 1024 })

    process.env.GSC_SITE_URL = 'https://www.mystay.city/'
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'sync-test@checkin-467416.iam.gserviceaccount.com'
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify(
      privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    )

    Date.now = jest.fn(() => new Date('2026-06-20T10:00:00.000Z').getTime())

    mockFindCities.mockResolvedValue([
      { id: 'city-annecy', slug: 'annecy' },
    ])

    mockUpsertDailySnapshot.mockResolvedValue({})
    mockUpsertPageSnapshot.mockResolvedValue({})
    mockUpsertQuerySnapshot.mockResolvedValue({})
    mockUpsertCitySnapshot.mockResolvedValue({})

    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)

      if (url === 'https://oauth2.googleapis.com/token') {
        return new Response(
          JSON.stringify({
            access_token: 'token-123',
            token_type: 'Bearer',
            expires_in: 3600,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      if (url === 'https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fwww.mystay.city%2F/searchAnalytics/query') {
        const body = JSON.parse(String(init?.body))
        const dimensions = Array.isArray(body.dimensions) ? body.dimensions.join(',') : ''

        if (dimensions === 'date,page') {
          return new Response(
            JSON.stringify({
              rows: [
                {
                  keys: ['2026-06-19', 'https://www.mystay.city/guide/annecy'],
                  clicks: 10,
                  impressions: 100,
                  ctr: 0.1,
                  position: 5,
                },
                {
                  keys: ['2026-06-19', 'https://www.mystay.city/guide/annecy/contact'],
                  clicks: 2,
                  impressions: 20,
                  ctr: 0.1,
                  position: 8,
                },
                {
                  keys: ['2026-06-19', 'https://www.mystay.city/blog/seo-local'],
                  clicks: 1,
                  impressions: 10,
                  ctr: 0.1,
                  position: 3,
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        }

        if (dimensions === 'date,query,page') {
          return new Response(
            JSON.stringify({
              rows: [
                {
                  keys: ['2026-06-19', 'guide annecy', 'https://www.mystay.city/guide/annecy'],
                  clicks: 5,
                  impressions: 50,
                  ctr: 0.1,
                  position: 4,
                },
                {
                  keys: ['2026-06-19', 'contact annecy', 'https://www.mystay.city/guide/annecy/contact'],
                  clicks: 1,
                  impressions: 10,
                  ctr: 0.1,
                  position: 6,
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

    if (originalPropertyId === undefined) delete process.env.GSC_SITE_URL
    else process.env.GSC_SITE_URL = originalPropertyId

    if (originalServiceAccountEmail === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    else process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = originalServiceAccountEmail

    if (originalServiceAccountKey === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    else process.env.GOOGLE_SERVICE_ACCOUNT_KEY = originalServiceAccountKey
  })

  it('imports GSC daily, page, query and city snapshots from Search Console rows', async () => {
    const result = await syncGoogleSearchConsoleSource()

    expect(result).toEqual({
      period_start: '2026-05-21',
      period_end: '2026-06-19',
      page_rows: 3,
      query_rows: 2,
      daily_rows: 1,
      city_rows: 1,
    })

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
          seo_clicks: 10,
          seo_impressions: 100,
        }),
      }),
    )

    expect(mockUpsertQuerySnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          snapshot_date_query_page_path: {
            snapshot_date: new Date('2026-06-19T00:00:00.000Z'),
            query: 'guide annecy',
            page_path: '/guide/annecy',
          },
        },
      }),
    )

    expect(mockUpsertDailySnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          snapshot_date: new Date('2026-06-19T00:00:00.000Z'),
        },
        update: expect.objectContaining({
          seo_clicks: 13,
          seo_impressions: 130,
          active_landing_pages: 3,
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
          seo_clicks: 12,
          seo_impressions: 120,
        }),
      }),
    )
  })
})
