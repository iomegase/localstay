import { z } from 'zod'

export const TRANSPORT_CARDS_MAX = 12

const optionalTag = z
  .string()
  .trim()
  .max(24, "L'étiquette doit faire 24 caractères maximum.")
  .nullable()
  .optional()
  .transform(value => (value && value.length > 0 ? value : null))

/** Cartes « Se déplacer » d'une ville (spec 055 AC-03-02). */
export const cityTransportCardsSchema = z.object({
  cards: z
    .array(z.object({
      id: z.string().min(1).max(64).optional(),
      title: z.string().trim().min(1, 'Le titre est requis.').max(80, 'Le titre doit faire 80 caractères maximum.'),
      tag: optionalTag,
      body: z.string().trim().min(1, 'Le texte est requis.').max(400, 'Le texte doit faire 400 caractères maximum.'),
    }))
    .max(TRANSPORT_CARDS_MAX, `${TRANSPORT_CARDS_MAX} cartes maximum.`),
})

export type CityTransportCardsInput = z.infer<typeof cityTransportCardsSchema>
