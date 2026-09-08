import { z } from 'zod'
import { LANDING_REVIEW_SOURCES } from '../types/landing-reviews'

const destinationSlugSchema = z.string().trim().min(1).max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug de destination invalide')

export const LandingReviewInputSchema = z.object({
  destination_slug: destinationSlugSchema,
  author: z.string().trim().min(2).max(80),
  quote: z.string().trim().min(10).max(1200),
  stay_date: z.string().trim().max(80).nullable().optional(),
  source: z.enum(LANDING_REVIEW_SOURCES),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  sort_order: z.number().int().min(0).max(9999),
}).strict()

export const LandingReviewIdSchema = z.string().uuid()

export type LandingReviewInput = z.infer<typeof LandingReviewInputSchema>
