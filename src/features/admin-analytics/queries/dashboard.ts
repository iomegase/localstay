import { prisma } from '@/shared/lib/prisma'
import type {
  AnalyticsBlockStatus,
  AnalyticsSourceKind,
  AnalyticsSourceStatus,
  AdminAnalyticsCityRow,
  AdminAnalyticsLiveBlock,
  AdminAnalyticsOverview,
  AdminAnalyticsPageRow,
  AdminAnalyticsPerformanceBlock,
  AdminAnalyticsQueryRow,
  AdminAnalyticsSourceStatus,
} from '@/features/admin-analytics/types'
import type {
  AnalyticsDateRangeInput,
  AnalyticsListFiltersInput,
  AnalyticsPerformanceFiltersInput,
} from '@/features/admin-analytics/schemas'

const SOURCE_ORDER: AnalyticsSourceKind[] = [
  'ga4',
  'gsc',
  'vercel_analytics',
  'vercel_speed_insights',
]

const SOURCE_ENV_REQUIREMENTS: Record<AnalyticsSourceKind, string[]> = {
  ga4: ['GA4_PROPERTY_ID', 'GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_SERVICE_ACCOUNT_KEY'],
  gsc: ['GSC_SITE_URL', 'GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_SERVICE_ACCOUNT_KEY'],
  vercel_analytics: ['VERCEL_ANALYTICS_PROJECT_ID'],
  vercel_speed_insights: ['VERCEL_ANALYTICS_PROJECT_ID'],
}

const DEFAULT_LIMIT = 20
const DEFAULT_DAYS = 30
const DAY_IN_MS = 24 * 60 * 60 * 1000

type SourceSyncRecord = {
  source: AnalyticsSourceKind
  status: 'success' | 'partial' | 'failed' | 'stale' | 'not_configured'
  last_success_at: Date | null
  error_code: string | null
  error_message: string | null
  details_json?: unknown
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function resolveDateRange(filters: AnalyticsDateRangeInput = {}) {
  const today = startOfUtcDay(new Date())

  if (filters.date_from && filters.date_to) {
    const start = new Date(`${filters.date_from}T00:00:00.000Z`)
    const end = new Date(`${filters.date_to}T00:00:00.000Z`)

    return {
      start,
      endExclusive: new Date(end.getTime() + DAY_IN_MS),
      date_from: filters.date_from,
      date_to: filters.date_to,
    }
  }

  if (filters.date_from) {
    const start = new Date(`${filters.date_from}T00:00:00.000Z`)
    return {
      start,
      endExclusive: new Date(today.getTime() + DAY_IN_MS),
      date_from: filters.date_from,
      date_to: toDateOnly(today),
    }
  }

  if (filters.date_to) {
    const end = new Date(`${filters.date_to}T00:00:00.000Z`)
    const start = new Date(end.getTime() - (DEFAULT_DAYS - 1) * DAY_IN_MS)
    return {
      start,
      endExclusive: new Date(end.getTime() + DAY_IN_MS),
      date_from: toDateOnly(start),
      date_to: filters.date_to,
    }
  }

  const start = new Date(today.getTime() - (DEFAULT_DAYS - 1) * DAY_IN_MS)
  return {
    start,
    endExclusive: new Date(today.getTime() + DAY_IN_MS),
    date_from: toDateOnly(start),
    date_to: toDateOnly(today),
  }
}

function toIsoOrNull(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null
}

function numberOrZero(value: number | null | undefined): number {
  return value ?? 0
}

function numberOrNull(value: number | null | undefined): number | null {
  return value ?? null
}

function mapSourceSyncStatus(record: SourceSyncRecord | undefined): AdminAnalyticsSourceStatus {
  if (!record) {
    return {
      source: 'ga4',
      status: 'not_configured',
      last_success_at: null,
      error_code: null,
      error_message: null,
    }
  }

  const status: AnalyticsSourceStatus =
    record.status === 'success'
      ? 'connected'
      : record.status === 'failed' && record.last_success_at
        ? 'stale'
        : record.status

  return {
    source: record.source,
    status,
    last_success_at: toIsoOrNull(record.last_success_at),
    error_code: record.error_code,
    error_message: record.error_message,
  }
}

function buildSourceStatus(source: AnalyticsSourceKind, record: SourceSyncRecord | undefined): AdminAnalyticsSourceStatus {
  if (!record) {
    if (isSourceConfigured(source)) {
      return {
        source,
        status: 'partial',
        last_success_at: null,
        error_code: 'SYNC_PENDING',
        error_message: getConfiguredSourceMessage(source),
      }
    }

    return {
      source,
      status: 'not_configured',
      last_success_at: null,
      error_code: null,
      error_message: null,
    }
  }

  if (record.status === 'success' && sourceSyncHasNoRows(record.details_json)) {
    return {
      source,
      status: 'connected',
      last_success_at: toIsoOrNull(record.last_success_at),
      error_code: 'NO_DATA',
      error_message: 'Source connectée, aucune donnée sur la période synchronisée.',
    }
  }

  return {
    ...mapSourceSyncStatus(record),
    source,
  }
}

function isSourceConfigured(source: AnalyticsSourceKind): boolean {
  return SOURCE_ENV_REQUIREMENTS[source].every(envName => {
    const value = process.env[envName]
    return typeof value === 'string' && value.length > 0
  })
}

function sourceSyncHasNoRows(details: unknown): boolean {
  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return false
  }

  const rowEntries = Object.entries(details).filter(([key, value]) => key.endsWith('_rows') && typeof value === 'number')
  return rowEntries.length > 0 && rowEntries.every(([, value]) => value === 0)
}

function getConfiguredSourceMessage(source: AnalyticsSourceKind): string {
  if (source === 'vercel_analytics' || source === 'vercel_speed_insights') {
    return 'Collecte activée sur le site, agrégation admin Vercel encore en attente.'
  }

  return 'Source configurée, synchronisation initiale en attente.'
}

function mapSourceStatusToBlockStatus(status: AnalyticsSourceStatus): AnalyticsBlockStatus {
  if (status === 'connected' || status === 'partial') return 'no_data'
  if (status === 'stale') return 'stale'
  if (status === 'failed') return 'failed'
  return 'not_configured'
}

export async function getAdminAnalyticsSourceStatuses(): Promise<AdminAnalyticsSourceStatus[]> {
  const syncs = await prisma.analyticsSourceSync.findMany({
    where: { deleted_at: null },
    orderBy: [{ source: 'asc' }, { created_at: 'desc' }],
    select: {
      source: true,
      status: true,
      last_success_at: true,
      error_code: true,
      error_message: true,
      details_json: true,
    },
  })

  const latestBySource = new Map<AnalyticsSourceKind, SourceSyncRecord>()
  for (const sync of syncs as SourceSyncRecord[]) {
    if (!latestBySource.has(sync.source)) {
      latestBySource.set(sync.source, sync)
    }
  }

  return SOURCE_ORDER.map(source => buildSourceStatus(source, latestBySource.get(source)))
}

export async function getAdminAnalyticsOverview(
  filters: AnalyticsDateRangeInput = {},
): Promise<AdminAnalyticsOverview> {
  const range = resolveDateRange(filters)
  const [aggregate, freshness] = await Promise.all([
    prisma.analyticsDailySnapshot.aggregate({
      where: {
        deleted_at: null,
        snapshot_date: {
          gte: range.start,
          lt: range.endExclusive,
        },
      },
      _sum: {
        seo_impressions: true,
        seo_clicks: true,
        active_landing_pages: true,
        sessions: true,
        users: true,
        page_views: true,
        contact_leads: true,
        lodging_contact_clicks: true,
        external_booking_clicks: true,
        qr_scans: true,
      },
      _avg: {
        seo_ctr: true,
        seo_avg_position: true,
        engagement_rate: true,
      },
    }),
    getAdminAnalyticsSourceStatuses(),
  ])

  return {
    period: {
      date_from: range.date_from,
      date_to: range.date_to,
    },
    acquisition_kpis: {
      seo_impressions: numberOrZero(aggregate._sum.seo_impressions),
      seo_clicks: numberOrZero(aggregate._sum.seo_clicks),
      seo_ctr: numberOrNull(aggregate._avg.seo_ctr),
      seo_avg_position: numberOrNull(aggregate._avg.seo_avg_position),
      active_landing_pages: numberOrZero(aggregate._sum.active_landing_pages),
    },
    engagement_kpis: {
      sessions: numberOrZero(aggregate._sum.sessions),
      users: numberOrZero(aggregate._sum.users),
      page_views: numberOrZero(aggregate._sum.page_views),
      engagement_rate: numberOrNull(aggregate._avg.engagement_rate),
      contact_leads: numberOrZero(aggregate._sum.contact_leads),
      lodging_contact_clicks: numberOrZero(aggregate._sum.lodging_contact_clicks),
      external_booking_clicks: numberOrZero(aggregate._sum.external_booking_clicks),
      qr_scans: numberOrZero(aggregate._sum.qr_scans),
    },
    freshness,
  }
}

export async function listAdminAnalyticsPages(
  filters: AnalyticsListFiltersInput = {},
): Promise<AdminAnalyticsPageRow[]> {
  const range = resolveDateRange(filters)
  const rows = await prisma.analyticsPageDailySnapshot.findMany({
    where: {
      deleted_at: null,
      snapshot_date: {
        gte: range.start,
        lt: range.endExclusive,
      },
      ...(filters.city_id ? { city_id: filters.city_id } : {}),
    },
    orderBy: [{ conversions: 'desc' }, { seo_clicks: 'desc' }, { sessions: 'desc' }],
    take: filters.limit ?? DEFAULT_LIMIT,
    select: {
      page_path: true,
      page_type: true,
      city_id: true,
      city: { select: { name: true } },
      sessions: true,
      seo_clicks: true,
      conversions: true,
    },
  })

  return rows.map(row => ({
    page_path: row.page_path,
    page_type: row.page_type,
    city_id: row.city_id,
    city_name: row.city?.name ?? null,
    sessions: row.sessions,
    seo_clicks: row.seo_clicks,
    conversions: row.conversions,
  }))
}

export async function listAdminAnalyticsQueries(
  filters: AnalyticsListFiltersInput = {},
): Promise<AdminAnalyticsQueryRow[]> {
  const range = resolveDateRange(filters)
  const rows = await prisma.analyticsQueryDailySnapshot.findMany({
    where: {
      deleted_at: null,
      snapshot_date: {
        gte: range.start,
        lt: range.endExclusive,
      },
      ...(filters.city_id ? { city_id: filters.city_id } : {}),
    },
    orderBy: [{ clicks: 'desc' }, { impressions: 'desc' }],
    take: filters.limit ?? DEFAULT_LIMIT,
    select: {
      query: true,
      page_path: true,
      city_id: true,
      city: { select: { name: true } },
      clicks: true,
      impressions: true,
      ctr: true,
      avg_position: true,
    },
  })

  return rows.map(row => ({
    query: row.query,
    page_path: row.page_path,
    city_id: row.city_id,
    city_name: row.city?.name ?? null,
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    avg_position: row.avg_position,
  }))
}

export async function listAdminAnalyticsCities(
  filters: AnalyticsDateRangeInput = {},
): Promise<AdminAnalyticsCityRow[]> {
  const range = resolveDateRange(filters)
  const [rows, topPages] = await Promise.all([
    prisma.analyticsCityDailySnapshot.findMany({
      where: {
        deleted_at: null,
        snapshot_date: {
          gte: range.start,
          lt: range.endExclusive,
        },
      },
      orderBy: [{ seo_clicks: 'desc' }, { sessions: 'desc' }],
      take: DEFAULT_LIMIT,
      select: {
        city_id: true,
        city: { select: { name: true } },
        sessions: true,
        seo_clicks: true,
        contact_leads: true,
        lodging_contact_clicks: true,
        external_booking_clicks: true,
      },
    }),
    prisma.analyticsPageDailySnapshot.findMany({
      where: {
        deleted_at: null,
        snapshot_date: {
          gte: range.start,
          lt: range.endExclusive,
        },
        city_id: { not: null },
      },
      orderBy: [{ sessions: 'desc' }, { seo_clicks: 'desc' }, { conversions: 'desc' }],
      select: {
        city_id: true,
        page_path: true,
      },
    }),
  ])

  const topPageByCity = new Map<string, string>()
  for (const row of topPages) {
    if (row.city_id && !topPageByCity.has(row.city_id)) {
      topPageByCity.set(row.city_id, row.page_path)
    }
  }

  return rows.map(row => ({
    city_id: row.city_id,
    city_name: row.city.name,
    sessions: row.sessions,
    seo_clicks: row.seo_clicks,
    conversions: row.contact_leads + row.lodging_contact_clicks + row.external_booking_clicks,
    top_page_path: topPageByCity.get(row.city_id) ?? null,
  }))
}

export async function getAdminAnalyticsPerformance(
  filters: AnalyticsPerformanceFiltersInput = {},
): Promise<AdminAnalyticsPerformanceBlock> {
  const range = resolveDateRange(filters)
  const rows = await prisma.analyticsPerfDailySnapshot.findMany({
    where: {
      deleted_at: null,
      snapshot_date: {
        gte: range.start,
        lt: range.endExclusive,
      },
      ...(filters.city_id ? { city_id: filters.city_id } : {}),
    },
    orderBy: [{ core_web_vitals_pass_rate: 'asc' }, { lcp: 'desc' }, { inp: 'desc' }],
    take: DEFAULT_LIMIT,
    select: {
      page_path: true,
      city_id: true,
      city: { select: { name: true } },
      core_web_vitals_pass_rate: true,
      lcp: true,
      inp: true,
      cls: true,
    },
  })

  if (rows.length > 0) {
    return {
      status: 'connected',
      rows: rows.map(row => ({
        page_path: row.page_path,
        city_id: row.city_id,
        city_name: row.city?.name ?? null,
        core_web_vitals_pass_rate: row.core_web_vitals_pass_rate,
        lcp: row.lcp,
        inp: row.inp,
        cls: row.cls,
      })),
    }
  }

  const sourceStatus = (await getAdminAnalyticsSourceStatuses()).find(
    source => source.source === 'vercel_speed_insights',
  )

  return {
    status: sourceStatus ? mapSourceStatusToBlockStatus(sourceStatus.status) : 'not_configured',
    rows: [],
  }
}

export async function getAdminAnalyticsLiveBlock(): Promise<AdminAnalyticsLiveBlock> {
  if (!process.env.VERCEL_ANALYTICS_PROJECT_ID) {
    return {
      status: 'not_configured',
      window_label: null,
      visitors: null,
      page_views: null,
      top_pages: [],
      top_referrers: [],
    }
  }

  return {
    status: 'no_data',
    window_label: null,
    visitors: null,
    page_views: null,
    top_pages: [],
    top_referrers: [],
  }
}
