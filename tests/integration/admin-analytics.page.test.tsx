/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdminPathLayout from '@/app/admin/layout'
import AdminAnalyticsPage from '@/app/admin/analytics/page'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/admin/analytics',
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('@/features/merchant/lib/get-page-admin', () => ({
  getPageAdmin: jest.fn(async () => ({ id: 'admin-1', role: 'admin' })),
}))

jest.mock('@/features/admin-analytics/queries/dashboard', () => ({
  getAdminAnalyticsOverview: jest.fn(async () => ({
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
    freshness: [
      { source: 'ga4', status: 'connected', last_success_at: '2026-06-18T08:00:00.000Z', error_code: null, error_message: null },
      { source: 'gsc', status: 'stale', last_success_at: '2026-06-17T08:00:00.000Z', error_code: 'SYNC_TIMEOUT', error_message: 'Google Search Console timeout' },
      { source: 'vercel_analytics', status: 'not_configured', last_success_at: null, error_code: null, error_message: null },
      { source: 'vercel_speed_insights', status: 'not_configured', last_success_at: null, error_code: null, error_message: null },
    ],
  })),
  getAdminAnalyticsSourceStatuses: jest.fn(async () => [
    { source: 'ga4', status: 'connected', last_success_at: '2026-06-18T08:00:00.000Z', error_code: null, error_message: null },
    { source: 'gsc', status: 'stale', last_success_at: '2026-06-17T08:00:00.000Z', error_code: 'SYNC_TIMEOUT', error_message: 'Google Search Console timeout' },
    { source: 'vercel_analytics', status: 'not_configured', last_success_at: null, error_code: null, error_message: null },
    { source: 'vercel_speed_insights', status: 'not_configured', last_success_at: null, error_code: null, error_message: null },
  ]),
  getAdminAnalyticsLiveBlock: jest.fn(async () => ({
    status: 'not_configured',
    window_label: null,
    visitors: null,
    page_views: null,
    top_pages: [],
    top_referrers: [],
  })),
  listAdminAnalyticsPages: jest.fn(async () => [
    { page_path: '/guide/annecy', page_type: 'city_guide', city_id: 'city-1', city_name: 'Annecy', sessions: 220, seo_clicks: 18, conversions: 4 },
  ]),
  listAdminAnalyticsQueries: jest.fn(async () => [
    { query: 'annecy chalet', page_path: '/guide/annecy/logements/chalet-hygge', city_id: 'city-1', city_name: 'Annecy', clicks: 11, impressions: 120, ctr: 0.091, avg_position: 6.4 },
  ]),
  listAdminAnalyticsCities: jest.fn(async () => [
    { city_id: 'city-1', city_name: 'Annecy', sessions: 310, seo_clicks: 24, conversions: 6, top_page_path: '/guide/annecy' },
  ]),
  getAdminAnalyticsPerformance: jest.fn(async () => ({
    status: 'connected',
    rows: [
      { page_path: '/guide/annecy', city_id: 'city-1', city_name: 'Annecy', core_web_vitals_pass_rate: 0.92, lcp: 2.1, inp: 180, cls: 0.04 },
    ],
  })),
}))

describe('030 admin analytics page', () => {
  it('AC-01-03: adds the Analytics SEO/GEO link to the admin navigation', () => {
    render(<AdminPathLayout><div>Contenu</div></AdminPathLayout>)

    expect(screen.getAllByRole('link', { name: /Analytics SEO\/GEO/i })[0]).toHaveAttribute('href', '/admin/analytics')
  })

  it('AC-01-01/01-04/02-03/03-01/03-02/03-03/03-05: renders the analytics cockpit', async () => {
    render(await AdminAnalyticsPage())

    expect(screen.getByRole('heading', { name: 'Analytics SEO/GEO' })).toBeInTheDocument()
    expect(screen.getByText('Google Analytics 4')).toBeInTheDocument()
    expect(screen.getByText('Google Search Console')).toBeInTheDocument()
    expect(screen.getByText('Vercel Analytics')).toBeInTheDocument()
    expect(screen.getByText('Vercel Speed Insights')).toBeInTheDocument()
    expect(screen.getByText('Impressions SEO')).toBeInTheDocument()
    expect(screen.getAllByText('Sessions').length).toBeGreaterThan(0)
    expect(screen.getAllByText('/guide/annecy').length).toBeGreaterThan(0)
    expect(screen.getByText('annecy chalet')).toBeInTheDocument()
    expect(screen.getAllByText('Annecy').length).toBeGreaterThan(0)
    expect(screen.getByText('Live indisponible')).toBeInTheDocument()
    expect(screen.getByText('Core Web Vitals')).toBeInTheDocument()
  })
})
