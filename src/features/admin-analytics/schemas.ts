import { z } from 'zod'

export const analyticsDateRangeSchema = z.object({
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
})

export const analyticsListFiltersSchema = analyticsDateRangeSchema.extend({
  city_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

export const analyticsPerformanceFiltersSchema = analyticsDateRangeSchema.extend({
  city_id: z.string().uuid().optional(),
})

export const analyticsSyncRequestSchema = z.object({
  source: z
    .enum(['ga4', 'gsc', 'vercel_analytics', 'vercel_speed_insights', 'all'])
    .optional()
    .default('all'),
})

export const analyticsInteractionEventSchema = z.object({
  event_type: z.enum([
    'owner_email_click',
    'mystay_email_click',
    'lodging_contact_click',
    'lodging_external_booking_click',
  ]),
  consent_state: z.literal('accepted'),
  page_path: z.string().min(1).max(500),
  city_slug: z.string().trim().min(1).max(120).optional().nullable(),
  lodging_id: z.string().uuid().optional().nullable(),
})

export type AnalyticsDateRangeInput = z.infer<typeof analyticsDateRangeSchema>
export type AnalyticsListFiltersInput = z.infer<typeof analyticsListFiltersSchema>
export type AnalyticsPerformanceFiltersInput = z.infer<typeof analyticsPerformanceFiltersSchema>
export type AnalyticsSyncRequestInput = z.infer<typeof analyticsSyncRequestSchema>
export type AnalyticsInteractionEventInput = z.infer<typeof analyticsInteractionEventSchema>
