const mockAggregateDaily = jest.fn()
const mockFindSourceSyncs = jest.fn()
const mockFindPageSnapshots = jest.fn()
const mockFindQuerySnapshots = jest.fn()
const mockFindCitySnapshots = jest.fn()
const mockFindPerfSnapshots = jest.fn()
const mockFetchGa4Today = jest.fn()
const mockFetchVercelLive = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    analyticsDailySnapshot: {
      aggregate: (...args: unknown[]) => mockAggregateDaily(...args),
    },
    analyticsSourceSync: {
      findMany: (...args: unknown[]) => mockFindSourceSyncs(...args),
    },
    analyticsPageDailySnapshot: {
      findMany: (...args: unknown[]) => mockFindPageSnapshots(...args),
    },
    analyticsQueryDailySnapshot: {
      findMany: (...args: unknown[]) => mockFindQuerySnapshots(...args),
    },
    analyticsCityDailySnapshot: {
      findMany: (...args: unknown[]) => mockFindCitySnapshots(...args),
    },
    analyticsPerfDailySnapshot: {
      findMany: (...args: unknown[]) => mockFindPerfSnapshots(...args),
    },
  },
}))

jest.mock('@/features/admin-analytics/services/google-analytics', () => ({
  fetchGoogleAnalyticsTodayMetrics: (...args: unknown[]) => mockFetchGa4Today(...args),
}))

jest.mock('@/features/admin-analytics/services/vercel-live', () => ({
  fetchVercelLiveMetrics: (...args: unknown[]) => mockFetchVercelLive(...args),
}))

import {
  getAdminAnalyticsGa4TodayBlock,
  getAdminAnalyticsLiveBlock,
  getAdminAnalyticsOverview,
  getAdminAnalyticsPerformance,
  getAdminAnalyticsSourceStatuses,
  listAdminAnalyticsCities,
  listAdminAnalyticsPages,
  listAdminAnalyticsQueries,
} from '@/features/admin-analytics/queries/dashboard'

describe('030 admin analytics dashboard queries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.VERCEL_ANALYTICS_PROJECT_ID
    delete process.env.VERCEL_ANALYTICS_LIVE_ENDPOINT
    delete process.env.VERCEL_ANALYTICS_LIVE_TOKEN
    delete process.env.GA4_PROPERTY_ID
    delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    delete process.env.GOOGLE_SERVICE_ACCOUNT_KEY

    mockAggregateDaily.mockResolvedValue({
      _sum: {
        seo_impressions: 1200,
        seo_clicks: 85,
        active_landing_pages: 14,
        sessions: 640,
        users: 420,
        page_views: 1300,
        contact_leads: 9,
        lodging_contact_clicks: 12,
        external_booking_clicks: 7,
        qr_scans: 31,
      },
      _avg: {
        seo_ctr: 0.071,
        seo_avg_position: 9.2,
        engagement_rate: 0.58,
      },
    })

    mockFindSourceSyncs.mockResolvedValue([
      {
        source: 'ga4',
        status: 'success',
        last_success_at: new Date('2026-06-18T08:00:00.000Z'),
        error_code: null,
        error_message: null,
      },
      {
        source: 'gsc',
        status: 'failed',
        last_success_at: new Date('2026-06-17T08:00:00.000Z'),
        error_code: 'SYNC_TIMEOUT',
        error_message: 'Google Search Console timeout',
      },
    ])

    mockFindPageSnapshots.mockResolvedValue([
      {
        page_path: '/guide/annecy',
        page_type: 'city_guide',
        city_id: 'city-1',
        city: { name: 'Annecy' },
        sessions: 220,
        seo_clicks: 18,
        conversions: 4,
      },
    ])

    mockFindQuerySnapshots.mockResolvedValue([
      {
        query: 'annecy chalet',
        page_path: '/guide/annecy/logements/chalet-hygge',
        city_id: 'city-1',
        city: { name: 'Annecy' },
        clicks: 11,
        impressions: 120,
        ctr: 0.091,
        avg_position: 6.4,
      },
    ])

    mockFindCitySnapshots.mockResolvedValue([
      {
        city_id: 'city-1',
        city: { name: 'Annecy' },
        sessions: 310,
        seo_clicks: 24,
        contact_leads: 2,
        lodging_contact_clicks: 3,
        external_booking_clicks: 1,
      },
    ])

    mockFindPerfSnapshots.mockResolvedValue([
      {
        page_path: '/guide/annecy',
        city_id: 'city-1',
        city: { name: 'Annecy' },
        core_web_vitals_pass_rate: 0.92,
        lcp: 2.1,
        inp: 180,
        cls: 0.04,
      },
    ])

    mockFetchGa4Today.mockResolvedValue(null)
    mockFetchVercelLive.mockResolvedValue({
      status: 'not_configured',
      window_label: null,
      visitors: null,
      page_views: null,
      top_pages: [],
      top_referrers: [],
    })
  })

  it('AC-02-01/02-02/02-04: aggregates overview KPIs and maps source freshness states', async () => {
    const overview = await getAdminAnalyticsOverview()

    expect(overview.acquisition_kpis.seo_impressions).toBe(1200)
    expect(overview.engagement_kpis.sessions).toBe(640)
    expect(overview.freshness).toEqual([
      expect.objectContaining({
        source: 'ga4',
        status: 'connected',
      }),
      expect.objectContaining({
        source: 'gsc',
        status: 'stale',
        error_code: 'SYNC_TIMEOUT',
      }),
      expect.objectContaining({
        source: 'vercel_analytics',
        status: 'not_configured',
      }),
      expect.objectContaining({
        source: 'vercel_speed_insights',
        status: 'not_configured',
      }),
    ])
  })

  it('AC-02-06/03-01/03-02/03-03/03-05: returns normalized tables, a degraded GA4 today block and a graceful live block', async () => {
    const [pages, queries, cities, performance, ga4Today, live] = await Promise.all([
      listAdminAnalyticsPages({ city_id: 'city-1', limit: 10 }),
      listAdminAnalyticsQueries({ city_id: 'city-1', limit: 10 }),
      listAdminAnalyticsCities({}),
      getAdminAnalyticsPerformance({}),
      getAdminAnalyticsGa4TodayBlock(),
      getAdminAnalyticsLiveBlock(),
    ])

    expect(pages).toEqual([
      expect.objectContaining({
        page_path: '/guide/annecy',
        city_name: 'Annecy',
      }),
    ])
    expect(queries).toEqual([
      expect.objectContaining({
        query: 'annecy chalet',
        city_name: 'Annecy',
      }),
    ])
    expect(cities).toEqual([
      expect.objectContaining({
        city_id: 'city-1',
        city_name: 'Annecy',
        conversions: 6,
      }),
    ])
    expect(performance).toEqual({
      status: 'connected',
      rows: [
        expect.objectContaining({
          page_path: '/guide/annecy',
          city_name: 'Annecy',
        }),
      ],
    })
    expect(ga4Today).toEqual({
      status: 'not_configured',
      window_label: "Aujourd'hui",
      sessions: null,
      users: null,
      page_views: null,
      engagement_rate: null,
    })
    expect(live).toEqual({
      status: 'not_configured',
      window_label: null,
      visitors: null,
      page_views: null,
      top_pages: [],
      top_referrers: [],
    })
    expect(mockFetchGa4Today).not.toHaveBeenCalled()
    expect(mockFetchVercelLive).toHaveBeenCalledTimes(1)
  })

  it('returns source statuses directly for the sources endpoint', async () => {
    const sources = await getAdminAnalyticsSourceStatuses()

    expect(sources).toHaveLength(4)
    expect(sources[0]).toEqual(
      expect.objectContaining({
        source: 'ga4',
      }),
    )
  })

  it('treats sources as configured when required env vars exist but no sync has run yet', async () => {
    mockFindSourceSyncs.mockResolvedValue([])
    process.env.GA4_PROPERTY_ID = '542429429'
    process.env.GSC_SITE_URL = 'https://www.mystay.city/'
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'my-stay@checkin-467416.iam.gserviceaccount.com'
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = '"-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n"'
    process.env.VERCEL_ANALYTICS_PROJECT_ID = 'prj_test123'

    const sources = await getAdminAnalyticsSourceStatuses()

    expect(sources).toEqual([
      expect.objectContaining({
        source: 'ga4',
        status: 'partial',
        error_code: 'SYNC_PENDING',
      }),
      expect.objectContaining({
        source: 'gsc',
        status: 'partial',
        error_code: 'SYNC_PENDING',
      }),
      expect.objectContaining({
        source: 'vercel_analytics',
        status: 'partial',
        error_code: 'SYNC_PENDING',
        error_message: 'Collecte activée sur le site, agrégation admin Vercel encore en attente.',
      }),
      expect.objectContaining({
        source: 'vercel_speed_insights',
        status: 'partial',
        error_code: 'SYNC_PENDING',
        error_message: 'Collecte activée sur le site, agrégation admin Vercel encore en attente.',
      }),
    ])
  })

  it('marks a successful source with zero imported rows as connected without data', async () => {
    mockFindSourceSyncs.mockResolvedValue([
      {
        source: 'ga4',
        status: 'success',
        last_success_at: new Date('2026-06-20T09:35:03.732Z'),
        error_code: null,
        error_message: null,
        details_json: {
          daily_rows: 0,
          page_rows: 0,
          city_rows: 0,
        },
      },
    ])

    const sources = await getAdminAnalyticsSourceStatuses()

    expect(sources[0]).toEqual(
      expect.objectContaining({
        source: 'ga4',
        status: 'connected',
        error_code: 'NO_DATA',
      }),
    )
    expect(sources[0].error_message).toContain('aucune donnée')
  })

  it('returns a connected GA4 today block when direct-read metrics succeed', async () => {
    process.env.GA4_PROPERTY_ID = '542429429'
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'my-stay@checkin-467416.iam.gserviceaccount.com'
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = '"-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n"'
    mockFetchGa4Today.mockResolvedValue({
      window_label: "Aujourd'hui",
      sessions: 42,
      users: 31,
      page_views: 88,
      engagement_rate: 0.61,
    })

    const block = await getAdminAnalyticsGa4TodayBlock()

    expect(block).toEqual({
      status: 'connected',
      window_label: "Aujourd'hui",
      sessions: 42,
      users: 31,
      page_views: 88,
      engagement_rate: 0.61,
    })
    expect(mockFetchGa4Today).toHaveBeenCalledTimes(1)
  })

  it('maps a configured GA4 today read failure to a failed block', async () => {
    process.env.GA4_PROPERTY_ID = '542429429'
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'my-stay@checkin-467416.iam.gserviceaccount.com'
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = '"-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n"'
    mockFetchGa4Today.mockRejectedValue(new Error('GA4 upstream failed'))

    const block = await getAdminAnalyticsGa4TodayBlock()

    expect(block).toEqual({
      status: 'failed',
      window_label: "Aujourd'hui",
      sessions: null,
      users: null,
      page_views: null,
      engagement_rate: null,
    })
  })
})
