const mockCreateSourceSync = jest.fn()
const mockSyncGoogleAnalyticsSource = jest.fn()
const mockSyncGoogleSearchConsoleSource = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    analyticsSourceSync: {
      create: (...args: unknown[]) => mockCreateSourceSync(...args),
    },
  },
}))

jest.mock('@/features/admin-analytics/services/google-analytics', () => ({
  syncGoogleAnalyticsSource: (...args: unknown[]) => mockSyncGoogleAnalyticsSource(...args),
}))

jest.mock('@/features/admin-analytics/services/google-search-console', () => ({
  syncGoogleSearchConsoleSource: (...args: unknown[]) => mockSyncGoogleSearchConsoleSource(...args),
}))

import { runAdminAnalyticsSync } from '@/features/admin-analytics/services/sync'

describe('030 admin analytics sync service', () => {
  const originalGa4PropertyId = process.env.GA4_PROPERTY_ID
  const originalGscSiteUrl = process.env.GSC_SITE_URL
  const originalGoogleServiceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const originalGoogleServiceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  const originalVercelProjectId = process.env.VERCEL_ANALYTICS_PROJECT_ID

  beforeEach(() => {
    jest.clearAllMocks()

    process.env.GA4_PROPERTY_ID = '542429429'
    process.env.GSC_SITE_URL = 'https://www.mystay.city/'
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'sync-test@checkin-467416.iam.gserviceaccount.com'
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = '"-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n"'
    process.env.VERCEL_ANALYTICS_PROJECT_ID = 'prj_test123'

    mockCreateSourceSync.mockResolvedValue({})
    mockSyncGoogleAnalyticsSource.mockResolvedValue({
      period_start: '2026-05-21',
      period_end: '2026-06-19',
      daily_rows: 0,
      page_rows: 0,
      city_rows: 0,
    })
    mockSyncGoogleSearchConsoleSource.mockResolvedValue({
      period_start: '2026-05-21',
      period_end: '2026-06-19',
      daily_rows: 0,
      page_rows: 0,
      query_rows: 0,
      city_rows: 0,
    })
  })

  afterAll(() => {
    if (originalGa4PropertyId === undefined) delete process.env.GA4_PROPERTY_ID
    else process.env.GA4_PROPERTY_ID = originalGa4PropertyId

    if (originalGscSiteUrl === undefined) delete process.env.GSC_SITE_URL
    else process.env.GSC_SITE_URL = originalGscSiteUrl

    if (originalGoogleServiceAccountEmail === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    else process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = originalGoogleServiceAccountEmail

    if (originalGoogleServiceAccountKey === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    else process.env.GOOGLE_SERVICE_ACCOUNT_KEY = originalGoogleServiceAccountKey

    if (originalVercelProjectId === undefined) delete process.env.VERCEL_ANALYTICS_PROJECT_ID
    else process.env.VERCEL_ANALYTICS_PROJECT_ID = originalVercelProjectId
  })

  it('AC-05-01/05-02: records Vercel sources as successful syncs when the project is configured', async () => {
    const result = await runAdminAnalyticsSync({ source: 'all' })

    expect(result).toEqual({
      status: 'ok',
      synced_sources: ['ga4', 'gsc', 'vercel_analytics', 'vercel_speed_insights'],
    })

    expect(mockCreateSourceSync).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: 'vercel_analytics',
          status: 'success',
          error_code: null,
          error_message: null,
          details_json: expect.objectContaining({
            project_id: 'prj_test123',
            daily_rows: 0,
            page_rows: 0,
            city_rows: 0,
          }),
        }),
      }),
    )

    expect(mockCreateSourceSync).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: 'vercel_speed_insights',
          status: 'success',
          error_code: null,
          error_message: null,
          details_json: expect.objectContaining({
            project_id: 'prj_test123',
            perf_rows: 0,
          }),
        }),
      }),
    )
  })
})
