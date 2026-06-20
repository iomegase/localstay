import { createSign } from 'node:crypto'
import { prisma } from '@/shared/lib/prisma'
import { resolveAnalyticsCityContext } from '@/features/admin-analytics/lib/city-path-mapping'
import type { AnalyticsPageType } from '@/features/admin-analytics/lib/city-path-mapping'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_ANALYTICS_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'
const GOOGLE_ANALYTICS_ENDPOINT = 'https://analyticsdata.googleapis.com/v1beta'
const SYNC_LOOKBACK_DAYS = 30
const DAY_IN_MS = 24 * 60 * 60 * 1000

type AnalyticsReportRow = {
  dimensionValues?: Array<{ value?: string }>
  metricValues?: Array<{ value?: string }>
}

type DailyMetricRow = {
  date: string
  sessions: number
  users: number
  pageViews: number
  engagementRate: number | null
}

type PageMetricRow = DailyMetricRow & {
  pagePath: string
  pageType: AnalyticsPageType
  cityId: string | null
}

type CityMetricRow = {
  date: string
  cityId: string
  sessions: number
  users: number
  pageViews: number
}

export async function syncGoogleAnalyticsSource(): Promise<{
  period_start: string
  period_end: string
  daily_rows: number
  page_rows: number
  city_rows: number
}> {
  const { propertyId, serviceAccountEmail, serviceAccountKey } = getGoogleAnalyticsConfig()
  const range = resolveSyncRange()
  const accessToken = await requestGoogleAccessToken({
    serviceAccountEmail,
    serviceAccountKey,
    scope: GOOGLE_ANALYTICS_SCOPE,
  })

  const [cities, dailyRows, pageRows] = await Promise.all([
    prisma.city.findMany({
      where: { deleted_at: null, is_active: true },
      select: { id: true, slug: true },
    }),
    runGa4Report({
      accessToken,
      propertyId,
      startDate: range.period_start,
      endDate: range.period_end,
      dimensions: ['date'],
      metrics: ['sessions', 'totalUsers', 'screenPageViews', 'engagementRate'],
    }),
    runGa4Report({
      accessToken,
      propertyId,
      startDate: range.period_start,
      endDate: range.period_end,
      dimensions: ['date', 'pagePath'],
      metrics: ['sessions', 'totalUsers', 'screenPageViews', 'engagementRate'],
    }),
  ])

  const cityIdBySlug = new Map(cities.map(city => [city.slug, city.id]))
  const normalizedDailyRows = normalizeDailyRows(dailyRows)
  const normalizedPageRows = normalizePageRows(pageRows, cityIdBySlug)
  const normalizedCityRows = aggregateCityRows(normalizedPageRows)

  await Promise.all([
    persistDailyRows(normalizedDailyRows),
    persistPageRows(normalizedPageRows),
    persistCityRows(normalizedCityRows),
  ])

  return {
    period_start: range.period_start,
    period_end: range.period_end,
    daily_rows: normalizedDailyRows.length,
    page_rows: normalizedPageRows.length,
    city_rows: normalizedCityRows.length,
  }
}

function getGoogleAnalyticsConfig(): {
  propertyId: string
  serviceAccountEmail: string
  serviceAccountKey: string
} {
  const propertyId = process.env.GA4_PROPERTY_ID
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY

  if (!propertyId || !serviceAccountEmail || !serviceAccountKey) {
    throw new Error('Google Analytics environment variables are missing.')
  }

  return { propertyId, serviceAccountEmail, serviceAccountKey }
}

function resolveSyncRange(): { period_start: string; period_end: string } {
  const end = startOfUtcDay(new Date(Date.now() - DAY_IN_MS))
  const start = new Date(end.getTime() - (SYNC_LOOKBACK_DAYS - 1) * DAY_IN_MS)

  return {
    period_start: toDateOnly(start),
    period_end: toDateOnly(end),
  }
}

async function requestGoogleAccessToken(input: {
  serviceAccountEmail: string
  serviceAccountKey: string
  scope: string
}): Promise<string> {
  const nowInSeconds = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: input.serviceAccountEmail,
    scope: input.scope,
    aud: GOOGLE_TOKEN_URL,
    exp: nowInSeconds + 3600,
    iat: nowInSeconds,
  }

  const unsignedToken = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}`
  const signer = createSign('RSA-SHA256')
  signer.update(unsignedToken)
  signer.end()
  const signature = signer
    .sign(normalizeServiceAccountKey(input.serviceAccountKey))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsignedToken}.${signature}`,
    }),
  })

  if (!response.ok) {
    throw new Error(await buildGoogleApiErrorMessage(response, 'Google token request failed'))
  }

  const data = await response.json() as { access_token?: string }
  if (!data.access_token) {
    throw new Error('Google token response did not include an access token.')
  }

  return data.access_token
}

async function runGa4Report(input: {
  accessToken: string
  propertyId: string
  startDate: string
  endDate: string
  dimensions: string[]
  metrics: string[]
}): Promise<AnalyticsReportRow[]> {
  const response = await fetch(
    `${GOOGLE_ANALYTICS_ENDPOINT}/properties/${input.propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: input.startDate, endDate: input.endDate }],
        dimensions: input.dimensions.map(name => ({ name })),
        metrics: input.metrics.map(name => ({ name })),
        keepEmptyRows: false,
        limit: 100000,
      }),
    },
  )

  if (!response.ok) {
    throw new Error(await buildGoogleApiErrorMessage(response, 'Google Analytics report failed'))
  }

  const data = await response.json() as { rows?: AnalyticsReportRow[] }
  return data.rows ?? []
}

function normalizeDailyRows(rows: AnalyticsReportRow[]): DailyMetricRow[] {
  return rows.flatMap(row => {
    const date = row.dimensionValues?.[0]?.value
    if (!date) return []

    return [{
      date: normalizeGa4Date(date),
      sessions: toInt(row.metricValues?.[0]?.value),
      users: toInt(row.metricValues?.[1]?.value),
      pageViews: toInt(row.metricValues?.[2]?.value),
      engagementRate: toFloat(row.metricValues?.[3]?.value),
    }]
  })
}

function normalizePageRows(
  rows: AnalyticsReportRow[],
  cityIdBySlug: Map<string, string>,
): PageMetricRow[] {
  return rows.flatMap(row => {
    const date = row.dimensionValues?.[0]?.value
    const pagePath = row.dimensionValues?.[1]?.value
    if (!date || !pagePath) return []

    const { citySlug, pageType } = resolveAnalyticsCityContext(pagePath)

    return [{
      date: normalizeGa4Date(date),
      pagePath,
      pageType,
      cityId: citySlug ? cityIdBySlug.get(citySlug) ?? null : null,
      sessions: toInt(row.metricValues?.[0]?.value),
      users: toInt(row.metricValues?.[1]?.value),
      pageViews: toInt(row.metricValues?.[2]?.value),
      engagementRate: toFloat(row.metricValues?.[3]?.value),
    }]
  })
}

function aggregateCityRows(rows: PageMetricRow[]): CityMetricRow[] {
  const aggregate = new Map<string, CityMetricRow>()

  for (const row of rows) {
    if (!row.cityId) continue

    const key = `${row.date}::${row.cityId}`
    const existing = aggregate.get(key) ?? {
      date: row.date,
      cityId: row.cityId,
      sessions: 0,
      users: 0,
      pageViews: 0,
    }

    existing.sessions += row.sessions
    existing.users += row.users
    existing.pageViews += row.pageViews
    aggregate.set(key, existing)
  }

  return Array.from(aggregate.values()).sort((a, b) => a.date.localeCompare(b.date))
}

async function persistDailyRows(rows: DailyMetricRow[]) {
  await Promise.all(rows.map(row => prisma.analyticsDailySnapshot.upsert({
    where: { snapshot_date: toSnapshotDate(row.date) },
    create: {
      snapshot_date: toSnapshotDate(row.date),
      sessions: row.sessions,
      users: row.users,
      page_views: row.pageViews,
      engagement_rate: row.engagementRate,
    },
    update: {
      deleted_at: null,
      sessions: row.sessions,
      users: row.users,
      page_views: row.pageViews,
      engagement_rate: row.engagementRate,
    },
  })))
}

async function persistPageRows(rows: PageMetricRow[]) {
  await Promise.all(rows.map(row => prisma.analyticsPageDailySnapshot.upsert({
    where: {
      snapshot_date_page_path: {
        snapshot_date: toSnapshotDate(row.date),
        page_path: row.pagePath,
      },
    },
    create: {
      snapshot_date: toSnapshotDate(row.date),
      page_path: row.pagePath,
      page_type: row.pageType,
      city_id: row.cityId,
      sessions: row.sessions,
      users: row.users,
      page_views: row.pageViews,
    },
    update: {
      deleted_at: null,
      page_type: row.pageType,
      city_id: row.cityId,
      sessions: row.sessions,
      users: row.users,
      page_views: row.pageViews,
    },
  })))
}

async function persistCityRows(rows: CityMetricRow[]) {
  await Promise.all(rows.map(row => prisma.analyticsCityDailySnapshot.upsert({
    where: {
      snapshot_date_city_id: {
        snapshot_date: toSnapshotDate(row.date),
        city_id: row.cityId,
      },
    },
    create: {
      snapshot_date: toSnapshotDate(row.date),
      city_id: row.cityId,
      sessions: row.sessions,
      users: row.users,
      page_views: row.pageViews,
    },
    update: {
      deleted_at: null,
      sessions: row.sessions,
      users: row.users,
      page_views: row.pageViews,
    },
  })))
}

function normalizeGa4Date(value: string): string {
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
}

function normalizeServiceAccountKey(value: string): string {
  const trimmed = value.trim()

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return JSON.parse(trimmed)
  }

  return trimmed.replace(/\\n/g, '\n')
}

function base64UrlEncode(value: object): string {
  return Buffer.from(JSON.stringify(value))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function toInt(value: string | undefined): number {
  return value ? Number.parseInt(value, 10) : 0
}

function toFloat(value: string | undefined): number | null {
  return value ? Number.parseFloat(value) : null
}

function toSnapshotDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`)
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

async function buildGoogleApiErrorMessage(response: Response, fallback: string): Promise<string> {
  const text = await response.text()

  if (!text) {
    return `${fallback} with status ${response.status}.`
  }

  try {
    const payload = JSON.parse(text) as {
      error?: {
        message?: string
        status?: string
      }
    }
    const message = payload.error?.message ?? payload.error?.status

    if (message) {
      return `${fallback} with status ${response.status}: ${message}`
    }
  } catch {}

  return `${fallback} with status ${response.status}: ${text}`
}
