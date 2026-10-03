import { z } from 'zod'

export const TRANSPORT_CARDS_MAX = 12

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional()

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
      body: z.string().trim().max(400, 'Le texte doit faire 400 caractères maximum.').optional().default(''),
      details: optionalText(3000),
      image_url: z.union([z.string().url().regex(/^https?:\/\//).max(2000), z.literal(''), z.null()]).optional(),
      external_url: z.union([
        z.string().url().regex(/^https?:\/\//).max(2000).refine(
          value => !/https?:\/\//i.test(value.slice(value.indexOf('://') + 3)),
          'Une seule URL est autorisée par carte.',
        ),
        z.literal(''), z.null(),
      ]).optional(),
      cta_label: optionalText(40),
      poi_id: z.union([z.string().uuid(), z.literal(''), z.null()]).optional(),
      service_key: z.union([z.literal('facilibus'), z.literal(''), z.null()]).optional(),
      is_free: z.boolean().optional(),
    }))
    .max(TRANSPORT_CARDS_MAX, `${TRANSPORT_CARDS_MAX} cartes maximum.`),
})

export type CityTransportCardsInput = z.infer<typeof cityTransportCardsSchema>
