import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockGetOverview = jest.fn()
const mockGetSources = jest.fn()
const mockGetGa4Today = jest.fn()
const mockGetLive = jest.fn()
const mockListPages = jest.fn()
const mockListQueries = jest.fn()
const mockListCities = jest.fn()
const mockGetPerformance = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: function() {
    return mockGetSessionAdmin.apply(this, arguments as never)
  },
}))

jest.mock('@/features/admin-analytics/queries/dashboard', () => ({
  getAdminAnalyticsOverview: function() {
    return mockGetOverview.apply(this, arguments as never)
  },
  getAdminAnalyticsSourceStatuses: function() {
    return mockGetSources.apply(this, arguments as never)
  },
  getAdminAnalyticsGa4TodayBlock: function() {
    return mockGetGa4Today.apply(this, arguments as never)
  },
  getAdminAnalyticsLiveBlock: function() {
    return mockGetLive.apply(this, arguments as never)
  },
  listAdminAnalyticsPages: function() {
    return mockListPages.apply(this, arguments as never)
  },
  listAdminAnalyticsQueries: function() {
    return mockListQueries.apply(this, arguments as never)
  },
  listAdminAnalyticsCities: function() {
    return mockListCities.apply(this, arguments as never)
  },
  getAdminAnalyticsPerformance: function() {
    return mockGetPerformance.apply(this, arguments as never)
  },
}))

import { GET as overviewGET } from '@/app/api/admin/analytics/overview/route'
import { GET as sourcesGET } from '@/app/api/admin/analytics/sources/route'
import { GET as ga4TodayGET } from '@/app/api/admin/analytics/ga4-today/route'
import { GET as liveGET } from '@/app/api/admin/analytics/live/route'
import { GET as pagesGET } from '@/app/api/admin/analytics/pages/route'
import { GET as queriesGET } from '@/app/api/admin/analytics/queries/route'
import { GET as citiesGET } from '@/app/api/admin/analytics/cities/route'
import { GET as performanceGET } from '@/app/api/admin/analytics/performance/route'

const CITY_ID = '11111111-1111-4111-8111-111111111111'

describe('030 admin analytics API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
    mockGetOverview.mockResolvedValue({
      period: { date_from: '2026-05-20', date_to: '2026-06-18' },
      acquisition_kpis: {
        seo_impressions: 1200,
        seo_clicks: 85,
        seo_ctr: 0.071,
        seo_avg_position: 9.2,
        active_landing_pages: 14,
      },
      engagement_kpis: {
        sessions: 640,
        users: 420,
        page_views: 1300,
        engagement_rate: 0.58,
        contact_leads: 9,
        lodging_contact_clicks: 12,
        external_booking_clicks: 7,
        qr_scans: 31,
      },
      freshness: [{ source: 'ga4', status: 'connected', last_success_at: '2026-06-18T08:00:00.000Z', error_code: null, error_message: null }],
    })
    mockGetSources.mockResolvedValue([{ source: 'ga4', status: 'connected', last_success_at: '2026-06-18T08:00:00.000Z', error_code: null, error_message: null }])
    mockGetGa4Today.mockResolvedValue({
      status: 'connected',
      window_label: "Aujourd'hui",
      sessions: 42,
      users: 31,
      page_views: 88,
      engagement_rate: 0.61,
    })
    mockGetLive.mockResolvedValue({ status: 'not_configured', window_label: null, visitors: null, page_views: null, top_pages: [], top_referrers: [] })
    mockListPages.mockResolvedValue([{ page_path: '/guide/annecy', page_type: 'city_guide', city_id: CITY_ID, city_name: 'Annecy', sessions: 220, seo_clicks: 18, conversions: 4 }])
    mockListQueries.mockResolvedValue([{ query: 'annecy chalet', page_path: '/guide/annecy/logements/chalet-hygge', city_id: CITY_ID, city_name: 'Annecy', clicks: 11, impressions: 120, ctr: 0.091, avg_position: 6.4 }])
    mockListCities.mockResolvedValue([{ city_id: CITY_ID, city_name: 'Annecy', sessions: 310, seo_clicks: 24, conversions: 6, top_page_path: '/guide/annecy' }])
    mockGetPerformance.mockResolvedValue({ status: 'connected', rows: [{ page_path: '/guide/annecy', city_id: CITY_ID, city_name: 'Annecy', core_web_vitals_pass_rate: 0.92, lcp: 2.1, inp: 180, cls: 0.04 }] })
  })

  it('AC-01-04/02-01/02-02: returns overview and source statuses', async () => {
    const [overviewRes, sourcesRes] = await Promise.all([
      overviewGET(new NextRequest('http://localhost/api/admin/analytics/overview')),
      sourcesGET(new NextRequest('http://localhost/api/admin/analytics/sources')),
    ])

    expect(overviewRes.status).toBe(200)
    expect(sourcesRes.status).toBe(200)
    await expect(overviewRes.json()).resolves.toEqual(expect.objectContaining({
      acquisition_kpis: expect.objectContaining({ seo_impressions: 1200 }),
    }))
    await expect(sourcesRes.json()).resolves.toEqual({
      data: [expect.objectContaining({ source: 'ga4' })],
    })
  })

  it('AC-02-06: returns the GA4 today block', async () => {
    const res = await ga4TodayGET()

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      status: 'connected',
      window_label: "Aujourd'hui",
      sessions: 42,
      users: 31,
      page_views: 88,
      engagement_rate: 0.61,
    })
  })

  it('AC-02-03/03-01/03-02/03-03/03-05: returns live, page, query, city and performance blocks', async () => {
    const [liveRes, pagesRes, queriesRes, citiesRes, performanceRes] = await Promise.all([
      liveGET(new NextRequest('http://localhost/api/admin/analytics/live')),
      pagesGET(new NextRequest(`http://localhost/api/admin/analytics/pages?date_from=2026-06-01&date_to=2026-06-18&city_id=${CITY_ID}&limit=10`)),
      queriesGET(new NextRequest(`http://localhost/api/admin/analytics/queries?date_from=2026-06-01&date_to=2026-06-18&city_id=${CITY_ID}&limit=10`)),
      citiesGET(new NextRequest('http://localhost/api/admin/analytics/cities?date_from=2026-06-01&date_to=2026-06-18')),
      performanceGET(new NextRequest(`http://localhost/api/admin/analytics/performance?date_from=2026-06-01&date_to=2026-06-18&city_id=${CITY_ID}`)),
    ])

    expect(liveRes.status).toBe(200)
    expect(pagesRes.status).toBe(200)
    expect(queriesRes.status).toBe(200)
    expect(citiesRes.status).toBe(200)
    expect(performanceRes.status).toBe(200)

    expect(mockListPages).toHaveBeenCalledWith({
      city_id: CITY_ID,
      date_from: '2026-06-01',
      date_to: '2026-06-18',
      limit: 10,
    })
    expect(mockListQueries).toHaveBeenCalledWith({
      city_id: CITY_ID,
      date_from: '2026-06-01',
      date_to: '2026-06-18',
      limit: 10,
    })
    expect(mockListCities).toHaveBeenCalledWith({
      date_from: '2026-06-01',
      date_to: '2026-06-18',
    })
    expect(mockGetPerformance).toHaveBeenCalledWith({
      city_id: CITY_ID,
      date_from: '2026-06-01',
      date_to: '2026-06-18',
    })
  })

  it('AC-01-02: preserves admin auth errors unchanged', async () => {
    const error = Response.json({ error: { code: 'FORBIDDEN', message: 'Accès réservé aux administrateurs', details: {} } }, { status: 403 })
    mockGetSessionAdmin.mockResolvedValue({ user: null, error })

    const res = await overviewGET(new NextRequest('http://localhost/api/admin/analytics/overview'))

    expect(res.status).toBe(403)
    expect(mockGetOverview).not.toHaveBeenCalled()
  })

  it('BR-20: rejects invalid analytics filters', async () => {
    const res = await pagesGET(new NextRequest('http://localhost/api/admin/analytics/pages?limit=999'))

    expect(res.status).toBe(400)
    expect(mockListPages).not.toHaveBeenCalled()
  })
})
