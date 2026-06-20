import type { AnalyticsSourceKind } from '@/features/admin-analytics/types'

const SYNC_LOOKBACK_DAYS = 30
const DAY_IN_MS = 24 * 60 * 60 * 1000

type VercelAnalyticsSyncDetails = {
  period_start: string
  period_end: string
  project_id: string
  collection_mode: 'client_component'
  daily_rows: number
  page_rows: number
  city_rows: number
}

type VercelSpeedInsightsSyncDetails = {
  period_start: string
  period_end: string
  project_id: string
  collection_mode: 'client_component'
  perf_rows: number
}

export async function syncVercelSource(
  source: Extract<AnalyticsSourceKind, 'vercel_analytics' | 'vercel_speed_insights'>,
): Promise<VercelAnalyticsSyncDetails | VercelSpeedInsightsSyncDetails> {
  const projectId = process.env.VERCEL_ANALYTICS_PROJECT_ID

  if (!projectId) {
    throw new Error('Vercel Analytics project ID is missing.')
  }

  const range = resolveSyncRange()

  if (source === 'vercel_analytics') {
    return {
      period_start: range.period_start,
      period_end: range.period_end,
      project_id: projectId,
      collection_mode: 'client_component',
      daily_rows: 0,
      page_rows: 0,
      city_rows: 0,
    }
  }

  return {
    period_start: range.period_start,
    period_end: range.period_end,
    project_id: projectId,
    collection_mode: 'client_component',
    perf_rows: 0,
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

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}
