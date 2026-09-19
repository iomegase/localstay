import { z } from 'zod'

export const CityUpdateSchema = z.object({
  name: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères.').max(120),
  postal_code: z.string().trim().regex(/^\d{5}$/, 'Le code postal doit contenir 5 chiffres.'),
}).strict()

export type CityUpdateInput = z.infer<typeof CityUpdateSchema>
