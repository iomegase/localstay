import { createSign } from 'node:crypto'
import { prisma } from '@/shared/lib/prisma'
import { resolveAnalyticsCityContext } from '@/features/admin-analytics/lib/city-path-mapping'
import type { AnalyticsPageType } from '@/features/admin-analytics/lib/city-path-mapping'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_SEARCH_CONSOLE_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'
const GOOGLE_SEARCH_CONSOLE_ENDPOINT = 'https://www.googleapis.com/webmasters/v3'
const GOOGLE_ROW_LIMIT = 25_000
const SYNC_LOOKBACK_DAYS = 30
const DAY_IN_MS = 24 * 60 * 60 * 1000

type SearchConsoleApiRow = {
  keys?: string[]
  clicks?: number
  impressions?: number
  ctr?: number
  position?: number
}

type AggregatedMetric = {
  clicks: number
  impressions: number
  weightedPositionSum: number
}

type AggregatedPageMetric = AggregatedMetric & {
  pagePath: string
  pageType: AnalyticsPageType
  cityId: string | null
}

type AggregatedQueryMetric = AggregatedMetric & {
  query: string
  pagePath: string
  cityId: string | null
}

export async function syncGoogleSearchConsoleSource(): Promise<{
  period_start: string
  period_end: string
  page_rows: number
  query_rows: number
  daily_rows: number
  city_rows: number
}> {
  const { siteUrl, serviceAccountEmail, serviceAccountKey } = getGoogleSearchConsoleConfig()
  const range = resolveSyncRange()
  const accessToken = await requestGoogleAccessToken({
    serviceAccountEmail,
    serviceAccountKey,
    scope: GOOGLE_SEARCH_CONSOLE_SCOPE,
  })

  const [cities, rawPageRows, rawQueryRows] = await Promise.all([
    prisma.city.findMany({
      where: { deleted_at: null, is_active: true },
      select: { id: true, slug: true },
    }),
    fetchSearchConsoleRows({
      accessToken,
      siteUrl,
      startDate: range.period_start,
      endDate: range.period_end,
      dimensions: ['date', 'page'],
    }),
    fetchSearchConsoleRows({
      accessToken,
      siteUrl,
      startDate: range.period_start,
      endDate: range.period_end,
      dimensions: ['date', 'query', 'page'],
    }),
  ])

  const cityIdBySlug = new Map(cities.map(city => [city.slug, city.id]))
  const pageMetrics = aggregatePageRows(rawPageRows, cityIdBySlug)
  const queryMetrics = aggregateQueryRows(rawQueryRows, cityIdBySlug)
  const dailyMetrics = aggregateDailyMetrics(pageMetrics)
  const cityMetrics = aggregateCityMetrics(pageMetrics)

  await Promise.all([
    persistPageMetrics(pageMetrics),
    persistQueryMetrics(queryMetrics),
    persistDailyMetrics(dailyMetrics),
    persistCityMetrics(cityMetrics),
  ])

  return {
    period_start: range.period_start,
    period_end: range.period_end,
    page_rows: pageMetrics.length,
    query_rows: queryMetrics.length,
    daily_rows: dailyMetrics.length,
    city_rows: cityMetrics.length,
  }
}

function resolveSyncRange(): { period_start: string; period_end: string } {
  const end = startOfUtcDay(new Date(Date.now() - DAY_IN_MS))
  const start = new Date(end.getTime() - (SYNC_LOOKBACK_DAYS - 1) * DAY_IN_MS)

  return {
    period_start: toDateOnly(start),
    period_end: toDateOnly(end),
  }
}

function getGoogleSearchConsoleConfig(): {
  siteUrl: string
  serviceAccountEmail: string
  serviceAccountKey: string
} {
  const siteUrl = process.env.GSC_SITE_URL
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY

  if (!siteUrl || !serviceAccountEmail || !serviceAccountKey) {
    throw new Error('Google Search Console environment variables are missing.')
  }

  return {
    siteUrl,
    serviceAccountEmail,
    serviceAccountKey,
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

async function fetchSearchConsoleRows(input: {
  accessToken: string
  siteUrl: string
  startDate: string
  endDate: string
  dimensions: string[]
}): Promise<SearchConsoleApiRow[]> {
  const rows: SearchConsoleApiRow[] = []
  let startRow = 0

  while (true) {
    const response = await fetch(
      `${GOOGLE_SEARCH_CONSOLE_ENDPOINT}/sites/${encodeURIComponent(input.siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: input.startDate,
          endDate: input.endDate,
          dimensions: input.dimensions,
          type: 'web',
          aggregationType: input.dimensions.includes('page') ? 'byPage' : 'byProperty',
          rowLimit: GOOGLE_ROW_LIMIT,
          startRow,
          dataState: 'final',
        }),
      },
    )

    if (!response.ok) {
      throw new Error(await buildGoogleApiErrorMessage(response, 'Search Console query failed'))
    }

    const data = await response.json() as { rows?: SearchConsoleApiRow[] }
    const pageRows = data.rows ?? []
    rows.push(...pageRows)

    if (pageRows.length < GOOGLE_ROW_LIMIT) {
      return rows
    }

    startRow += pageRows.length
  }
}

function aggregatePageRows(
  rows: SearchConsoleApiRow[],
  cityIdBySlug: Map<string, string>,
): Array<AggregatedPageMetric & { date: string }> {
  const aggregates = new Map<string, AggregatedPageMetric>()

  for (const row of rows) {
    const [date, rawPage] = row.keys ?? []
    if (!date || !rawPage) continue

    const pagePath = normalizePagePath(rawPage)
    const { citySlug, pageType } = resolveAnalyticsCityContext(pagePath)
    const cityId = citySlug ? cityIdBySlug.get(citySlug) ?? null : null
    const key = `${date}::${pagePath}`
    const aggregate = aggregates.get(key) ?? {
      pagePath,
      pageType,
      cityId,
      clicks: 0,
      impressions: 0,
      weightedPositionSum: 0,
    }

    addMetrics(aggregate, row)
    aggregates.set(key, aggregate)
  }

  return sortMetrics(Array.from(aggregates.entries()).map(([key, value]) => ({
    date: key.split('::')[0],
    ...value,
  })))
}

function aggregateQueryRows(
  rows: SearchConsoleApiRow[],
  cityIdBySlug: Map<string, string>,
): Array<AggregatedQueryMetric & { date: string }> {
  const aggregates = new Map<string, AggregatedQueryMetric & { date: string }>()

  for (const row of rows) {
    const [date, query, rawPage] = row.keys ?? []
    if (!date || !query || !rawPage) continue

    const pagePath = normalizePagePath(rawPage)
    const { citySlug } = resolveAnalyticsCityContext(pagePath)
    const cityId = citySlug ? cityIdBySlug.get(citySlug) ?? null : null
    const key = `${date}::${query}::${pagePath}`
    const aggregate = aggregates.get(key) ?? {
      date,
      query,
      pagePath,
      cityId,
      clicks: 0,
      impressions: 0,
      weightedPositionSum: 0,
    }

    addMetrics(aggregate, row)
    aggregates.set(key, aggregate)
  }

  return sortMetrics(Array.from(aggregates.values()))
}

function aggregateDailyMetrics(
  rows: Array<AggregatedPageMetric & { date: string }>,
): Array<AggregatedMetric & { date: string; activeLandingPages: number }> {
  const aggregates = new Map<string, AggregatedMetric & { date: string; activeLandingPages: number }>()

  for (const row of rows) {
    const aggregate = aggregates.get(row.date) ?? {
      date: row.date,
      clicks: 0,
      impressions: 0,
      weightedPositionSum: 0,
      activeLandingPages: 0,
    }

    aggregate.clicks += row.clicks
    aggregate.impressions += row.impressions
    aggregate.weightedPositionSum += row.weightedPositionSum
    if (row.impressions > 0) {
      aggregate.activeLandingPages += 1
    }

    aggregates.set(row.date, aggregate)
  }

  return sortMetrics(Array.from(aggregates.values()))
}

function aggregateCityMetrics(
  rows: Array<AggregatedPageMetric & { date: string }>,
): Array<AggregatedMetric & { date: string; cityId: string }> {
  const aggregates = new Map<string, AggregatedMetric & { date: string; cityId: string }>()

  for (const row of rows) {
    if (!row.cityId) continue

    const key = `${row.date}::${row.cityId}`
    const aggregate = aggregates.get(key) ?? {
      date: row.date,
      cityId: row.cityId,
      clicks: 0,
      impressions: 0,
      weightedPositionSum: 0,
    }

    aggregate.clicks += row.clicks
    aggregate.impressions += row.impressions
    aggregate.weightedPositionSum += row.weightedPositionSum
    aggregates.set(key, aggregate)
  }

  return sortMetrics(Array.from(aggregates.values()))
}

async function persistPageMetrics(rows: Array<AggregatedPageMetric & { date: string }>) {
  await Promise.all(rows.map(row => {
    const snapshotDate = toSnapshotDate(row.date)

    return prisma.analyticsPageDailySnapshot.upsert({
      where: {
        snapshot_date_page_path: {
          snapshot_date: snapshotDate,
          page_path: row.pagePath,
        },
      },
      create: {
        snapshot_date: snapshotDate,
        page_path: row.pagePath,
        page_type: row.pageType,
        city_id: row.cityId,
        seo_clicks: row.clicks,
        seo_impressions: row.impressions,
        seo_ctr: computeCtr(row),
        seo_avg_position: computeAveragePosition(row),
      },
      update: {
        deleted_at: null,
        page_type: row.pageType,
        city_id: row.cityId,
        seo_clicks: row.clicks,
        seo_impressions: row.impressions,
        seo_ctr: computeCtr(row),
        seo_avg_position: computeAveragePosition(row),
      },
    })
  }))
}

async function persistQueryMetrics(rows: Array<AggregatedQueryMetric & { date: string }>) {
  await Promise.all(rows.map(row => {
    const snapshotDate = toSnapshotDate(row.date)

    return prisma.analyticsQueryDailySnapshot.upsert({
      where: {
        snapshot_date_query_page_path: {
          snapshot_date: snapshotDate,
          query: row.query,
          page_path: row.pagePath,
        },
      },
      create: {
        snapshot_date: snapshotDate,
        query: row.query,
        page_path: row.pagePath,
        city_id: row.cityId,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: computeCtr(row),
        avg_position: computeAveragePosition(row),
      },
      update: {
        deleted_at: null,
        city_id: row.cityId,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: computeCtr(row),
        avg_position: computeAveragePosition(row),
      },
    })
  }))
}

async function persistDailyMetrics(rows: Array<AggregatedMetric & { date: string; activeLandingPages: number }>) {
  await Promise.all(rows.map(row => {
    const snapshotDate = toSnapshotDate(row.date)

    return prisma.analyticsDailySnapshot.upsert({
      where: { snapshot_date: snapshotDate },
      create: {
        snapshot_date: snapshotDate,
        seo_clicks: row.clicks,
        seo_impressions: row.impressions,
        seo_ctr: computeCtr(row),
        seo_avg_position: computeAveragePosition(row),
        active_landing_pages: row.activeLandingPages,
      },
      update: {
        deleted_at: null,
        seo_clicks: row.clicks,
        seo_impressions: row.impressions,
        seo_ctr: computeCtr(row),
        seo_avg_position: computeAveragePosition(row),
        active_landing_pages: row.activeLandingPages,
      },
    })
  }))
}

async function persistCityMetrics(rows: Array<AggregatedMetric & { date: string; cityId: string }>) {
  await Promise.all(rows.map(row => {
    const snapshotDate = toSnapshotDate(row.date)

    return prisma.analyticsCityDailySnapshot.upsert({
      where: {
        snapshot_date_city_id: {
          snapshot_date: snapshotDate,
          city_id: row.cityId,
        },
      },
      create: {
        snapshot_date: snapshotDate,
        city_id: row.cityId,
        seo_clicks: row.clicks,
        seo_impressions: row.impressions,
        seo_ctr: computeCtr(row),
        seo_avg_position: computeAveragePosition(row),
      },
      update: {
        deleted_at: null,
        seo_clicks: row.clicks,
        seo_impressions: row.impressions,
        seo_ctr: computeCtr(row),
        seo_avg_position: computeAveragePosition(row),
      },
    })
  }))
}

function addMetrics(aggregate: AggregatedMetric, row: SearchConsoleApiRow) {
  const clicks = toSafeInteger(row.clicks)
  const impressions = toSafeInteger(row.impressions)
  const position = typeof row.position === 'number' ? row.position : null

  aggregate.clicks += clicks
  aggregate.impressions += impressions
  aggregate.weightedPositionSum += position !== null ? position * impressions : 0
}

function computeCtr(metric: AggregatedMetric): number | null {
  if (metric.impressions <= 0) return null
  return metric.clicks / metric.impressions
}

function computeAveragePosition(metric: AggregatedMetric): number | null {
  if (metric.impressions <= 0) return null
  return metric.weightedPositionSum / metric.impressions
}

function normalizePagePath(value: string): string {
  const pathname = value.startsWith('http://') || value.startsWith('https://')
    ? new URL(value).pathname
    : value

  return pathname.split('?')[0].replace(/\/+$/g, '') || '/'
}

function normalizeServiceAccountKey(value: string): string {
  const trimmed = value.trim()

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return JSON.parse(trimmed)
  }

  return trimmed.replace(/\\n/g, '\n')
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

function toSafeInteger(value: number | undefined): number {
  return typeof value === 'number' ? Math.round(value) : 0
}

function base64UrlEncode(value: object): string {
  return Buffer.from(JSON.stringify(value))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function sortMetrics<T extends { date: string }>(rows: T[]): T[] {
  return rows.sort((left, right) => left.date.localeCompare(right.date))
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
