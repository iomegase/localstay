import { z } from 'zod'

export const GoogleReviewIdSchema = z.string().uuid()

export const PublicationsInputSchema = z.object({
  destination_ids: z.array(z.string().uuid()).max(50),
}).strict()
