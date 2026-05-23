import { z } from 'zod'

export const CreateLodgingSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  city_id: z.string().uuid(),
})

export const UpdateLodgingSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  city_id: z.string().uuid().optional(),
}).refine(data => data.name !== undefined || data.city_id !== undefined, {
  message: 'Au moins un champ doit être fourni',
})

export type CreateLodgingInput = z.infer<typeof CreateLodgingSchema>
export type UpdateLodgingInput = z.infer<typeof UpdateLodgingSchema>
