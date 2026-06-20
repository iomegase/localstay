export type AnalyticsInteractionEventType =
  | 'owner_email_click'
  | 'mystay_email_click'
  | 'lodging_contact_click'
  | 'lodging_external_booking_click'

export type AnalyticsConsentState = 'accepted' | 'refused' | 'unset'

export type AnalyticsSourceKind =
  | 'ga4'
  | 'gsc'
  | 'vercel_analytics'
  | 'vercel_speed_insights'

export type AnalyticsSourceStatus =
  | 'connected'
  | 'not_configured'
  | 'failed'
  | 'stale'
  | 'partial'

export type AnalyticsBlockStatus =
  | 'connected'
  | 'not_configured'
  | 'failed'
  | 'stale'
  | 'no_data'

export type AdminAnalyticsSourceStatus = {
  source: AnalyticsSourceKind
  status: AnalyticsSourceStatus
  last_success_at: string | null
  error_code: string | null
  error_message: string | null
}

export type AdminAnalyticsOverview = {
  period: {
    date_from: string
    date_to: string
  }
  acquisition_kpis: {
    seo_impressions: number
    seo_clicks: number
    seo_ctr: number | null
    seo_avg_position: number | null
    active_landing_pages: number
  }
  engagement_kpis: {
    sessions: number
    users: number
    page_views: number
    engagement_rate: number | null
    contact_leads: number
    lodging_contact_clicks: number
    external_booking_clicks: number
    qr_scans: number
  }
  freshness: AdminAnalyticsSourceStatus[]
}

export type AdminAnalyticsLiveBlock = {
  status: AnalyticsBlockStatus
  window_label: string | null
  visitors: number | null
  page_views: number | null
  top_pages: Array<{
    page_path: string
    page_views: number
  }>
  top_referrers: Array<{
    referrer: string
    visitors: number
  }>
}

export type AdminAnalyticsPageRow = {
  page_path: string
  page_type: string
  city_id: string | null
  city_name: string | null
  sessions: number
  seo_clicks: number
  conversions: number
}

export type AdminAnalyticsQueryRow = {
  query: string
  page_path: string | null
  city_id: string | null
  city_name: string | null
  clicks: number
  impressions: number
  ctr: number | null
  avg_position: number | null
}

export type AdminAnalyticsCityRow = {
  city_id: string
  city_name: string
  sessions: number
  seo_clicks: number
  conversions: number
  top_page_path: string | null
}

export type AdminAnalyticsPerformanceRow = {
  page_path: string | null
  city_id: string | null
  city_name: string | null
  core_web_vitals_pass_rate: number | null
  lcp: number | null
  inp: number | null
  cls: number | null
}

export type AdminAnalyticsPerformanceBlock = {
  status: AnalyticsBlockStatus
  rows: AdminAnalyticsPerformanceRow[]
}
