import { z } from 'zod'
import { DESCRIPTION_MAX_CHARS } from '@/shared/lib/description-length'

// Spec 049: shared validation, safe to import from the admin client.
export const HttpUrlSchema = z.string().url().refine(value => {
  const url = new URL(value)
  return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
}, 'URL HTTP(S) attendue')

export const DescriptionIdentitySchema = z.object({
  name: z.string().trim().min(1),
  address: z.string().trim().min(1),
  city: z.string().trim().min(1),
  website: HttpUrlSchema.nullable(),
})

export const DescriptionSuggestionSchema = z.object({
  description: z.string().trim().min(1).max(DESCRIPTION_MAX_CHARS),
  source_mode: z.enum(['official_website', 'web_search']),
  sources: z.array(z.object({ title: z.string().min(1), url: HttpUrlSchema }).strict()).min(1),
  search_entry_point: z.string().nullable(),
}).strict()

export type DescriptionIdentity = z.infer<typeof DescriptionIdentitySchema>
export type DescriptionSuggestion = z.infer<typeof DescriptionSuggestionSchema>

const errors = {
  INVALID_INPUT: [400, 'Paramètres invalides.'],
  POI_NOT_FOUND: [404, 'POI introuvable.'],
  POI_ARCHIVED: [409, 'Restaurez le POI avant de proposer une description.'],
  SOURCE_URL_UNREADABLE: [422, 'Le site officiel est illisible. Vérifiez son URL ou réessayez plus tard.'],
  DESCRIPTION_SOURCES_INSUFFICIENT: [422, 'Les sources ne permettent pas de préparer une description fiable de ce POI.'],
  DESCRIPTION_GENERATION_FAILED: [502, 'La description n’a pas pu être préparée. Réessayez plus tard.'],
  DESCRIPTION_SERVICE_UNAVAILABLE: [503, 'Le service de description est indisponible. Réessayez plus tard.'],
} as const

export class DescriptionAssistanceError extends Error {
  readonly status: number

  constructor(public readonly code: keyof typeof errors) {
    super(errors[code][1])
    this.status = errors[code][0]
  }
}
