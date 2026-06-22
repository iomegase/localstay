import { prisma } from '@/shared/lib/prisma'
import type { AdminAnalyticsLiveBlock } from '@/features/admin-analytics/types'

const LIVE_WINDOW_MINUTES = 30
const MINUTE_IN_MS = 60 * 1000
const TOP_LIMIT = 5

export async function getInternalVercelLiveBlock(): Promise<AdminAnalyticsLiveBlock> {
  const threshold = new Date(Date.now() - LIVE_WINDOW_MINUTES * MINUTE_IN_MS)
  const rows = await prisma.analyticsVercelLiveEvent.findMany({
    where: {
      deleted_at: null,
      occurred_at: { gte: threshold },
      source_event_type: 'pageview',
    },
    orderBy: { occurred_at: 'desc' },
    select: {
      dedupe_key: true,
      session_id: true,
      device_id: true,
      page_path: true,
      referrer: true,
    },
  })

  if (rows.length === 0) {
    return {
      status: 'no_data',
      window_label: 'Last 30 minutes',
      visitors: null,
      page_views: null,
      top_pages: [],
      top_referrers: [],
    }
  }

  const visitors = new Set<string>()
  const pageCounts = new Map<string, number>()
  const referrerCounts = new Map<string, number>()

  for (const row of rows) {
    visitors.add(row.session_id ?? row.device_id ?? row.dedupe_key)

    if (row.page_path) {
      pageCounts.set(row.page_path, (pageCounts.get(row.page_path) ?? 0) + 1)
    }

    if (row.referrer) {
      referrerCounts.set(row.referrer, (referrerCounts.get(row.referrer) ?? 0) + 1)
    }
  }

  return {
    status: 'connected',
    window_label: 'Last 30 minutes',
    visitors: visitors.size,
    page_views: rows.length,
    top_pages: Array.from(pageCounts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, TOP_LIMIT)
      .map(([page_path, page_views]) => ({ page_path, page_views })),
    top_referrers: Array.from(referrerCounts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, TOP_LIMIT)
      .map(([referrer, visitors]) => ({ referrer, visitors })),
  }
}
