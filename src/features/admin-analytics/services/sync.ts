import { prisma } from '@/shared/lib/prisma'
import { syncGoogleAnalyticsSource } from '@/features/admin-analytics/services/google-analytics'
import { syncGoogleSearchConsoleSource } from '@/features/admin-analytics/services/google-search-console'
import { syncVercelSource } from '@/features/admin-analytics/services/vercel'
import type { AnalyticsSourceKind } from '@/features/admin-analytics/types'
import type { AnalyticsSyncRequestInput } from '@/features/admin-analytics/schemas'

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

function resolveRequestedSources(source: AnalyticsSyncRequestInput['source']): AnalyticsSourceKind[] {
  if (!source || source === 'all') {
    return SOURCE_ORDER
  }

  return [source]
}

function getMissingEnvNames(source: AnalyticsSourceKind): string[] {
  return SOURCE_ENV_REQUIREMENTS[source].filter(name => !process.env[name])
}

export async function runAdminAnalyticsSync(
  input: AnalyticsSyncRequestInput,
): Promise<{ status: 'ok' | 'partial'; synced_sources: AnalyticsSourceKind[] }> {
  const requestedSources = resolveRequestedSources(input.source)
  const syncedSources: AnalyticsSourceKind[] = []

  for (const source of requestedSources) {
    const startedAt = new Date()
    const missingEnv = getMissingEnvNames(source)

    if (missingEnv.length > 0) {
      await prisma.analyticsSourceSync.create({
        data: {
          source,
          status: 'not_configured',
          started_at: startedAt,
          finished_at: new Date(),
          error_code: 'NOT_CONFIGURED',
          error_message: `Missing environment variables: ${missingEnv.join(', ')}`,
          details_json: { missing_env: missingEnv },
        },
      })
      continue
    }

    try {
      if (source === 'ga4') {
        const details = await syncGoogleAnalyticsSource()

        await prisma.analyticsSourceSync.create({
          data: {
            source,
            status: 'success',
            started_at: startedAt,
            finished_at: new Date(),
            period_start: new Date(`${details.period_start}T00:00:00.000Z`),
            period_end: new Date(`${details.period_end}T00:00:00.000Z`),
            last_success_at: new Date(),
            details_json: details,
          },
        })

        syncedSources.push(source)
        continue
      }

      if (source === 'gsc') {
        const details = await syncGoogleSearchConsoleSource()

        await prisma.analyticsSourceSync.create({
          data: {
            source,
            status: 'success',
            started_at: startedAt,
            finished_at: new Date(),
            period_start: new Date(`${details.period_start}T00:00:00.000Z`),
            period_end: new Date(`${details.period_end}T00:00:00.000Z`),
            last_success_at: new Date(),
            details_json: details,
          },
        })

        syncedSources.push(source)
        continue
      }

      if (source === 'vercel_analytics' || source === 'vercel_speed_insights') {
        const details = await syncVercelSource(source)

        await prisma.analyticsSourceSync.create({
          data: {
            source,
            status: 'success',
            started_at: startedAt,
            finished_at: new Date(),
            period_start: new Date(`${details.period_start}T00:00:00.000Z`),
            period_end: new Date(`${details.period_end}T00:00:00.000Z`),
            last_success_at: new Date(),
            error_code: null,
            error_message: null,
            details_json: details,
          },
        })

        syncedSources.push(source)
        continue
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown analytics sync error.'

      await prisma.analyticsSourceSync.create({
        data: {
          source,
          status: 'failed',
          started_at: startedAt,
          finished_at: new Date(),
          error_code: 'SYNC_ERROR',
          error_message: message,
          details_json: {
            message,
          },
        },
      })
    }
  }

  return {
    status: syncedSources.length === requestedSources.length ? 'ok' : 'partial',
    synced_sources: syncedSources,
  }
}
