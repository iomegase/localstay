import { z } from 'zod'
import type { AdminAnalyticsLiveBlock } from '@/features/admin-analytics/types'

const vercelLivePayloadSchema = z.object({
  window_label: z.string().trim().min(1).nullable().optional(),
  visitors: z.coerce.number().int().nonnegative(),
  page_views: z.coerce.number().int().nonnegative(),
  top_pages: z.array(z.object({
    page_path: z.string().trim().min(1),
    page_views: z.coerce.number().int().nonnegative(),
  })).default([]),
  top_referrers: z.array(z.object({
    referrer: z.string().trim().min(1),
    visitors: z.coerce.number().int().nonnegative(),
  })).default([]),
})

function emptyLiveBlock(status: AdminAnalyticsLiveBlock['status']): AdminAnalyticsLiveBlock {
  return {
    status,
    window_label: null,
    visitors: null,
    page_views: null,
    top_pages: [],
    top_referrers: [],
  }
}

function buildAuthHeaders(): HeadersInit | undefined {
  const token = process.env.VERCEL_ANALYTICS_LIVE_TOKEN
  if (!token) return undefined

  return {
    Authorization: `Bearer ${token}`,
  }
}

export async function fetchVercelLiveMetrics(): Promise<AdminAnalyticsLiveBlock> {
  if (!process.env.VERCEL_ANALYTICS_PROJECT_ID || !process.env.VERCEL_ANALYTICS_LIVE_ENDPOINT) {
    return emptyLiveBlock('not_configured')
  }

  try {
    const response = await fetch(process.env.VERCEL_ANALYTICS_LIVE_ENDPOINT, {
      headers: buildAuthHeaders(),
      cache: 'no-store',
    })

    if (!response.ok) {
      return emptyLiveBlock('failed')
    }

    const parsed = vercelLivePayloadSchema.safeParse(await response.json())
    if (!parsed.success) {
      return emptyLiveBlock('failed')
    }

    if (
      parsed.data.visitors === 0 &&
      parsed.data.page_views === 0 &&
      parsed.data.top_pages.length === 0 &&
      parsed.data.top_referrers.length === 0
    ) {
      return {
        ...emptyLiveBlock('no_data'),
        window_label: parsed.data.window_label ?? null,
      }
    }

    return {
      status: 'connected',
      window_label: parsed.data.window_label ?? null,
      visitors: parsed.data.visitors,
      page_views: parsed.data.page_views,
      top_pages: parsed.data.top_pages,
      top_referrers: parsed.data.top_referrers,
    }
  } catch {
    return emptyLiveBlock('failed')
  }
}
