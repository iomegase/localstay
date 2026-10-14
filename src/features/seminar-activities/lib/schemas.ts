import { z } from 'zod'
import { SEMINAR_ACTIVITY_CATEGORIES, type SeminarActivityCategory } from '../types'

// Spec 097 API Contract : validation Zod de toutes les entrées admin.

const categorySchema = z.enum(SEMINAR_ACTIVITY_CATEGORIES as [SeminarActivityCategory, ...SeminarActivityCategory[]])
const centsSchema = z.number().int().min(0).max(100_000_000).nullable()
const nullableText = (max: number) => z.union([
  z.string().trim().max(max).transform(value => value || null),
  z.null(),
])

const activityFields = {
  title: z.string().trim().min(1).max(120),
  category: categorySchema,
  description: z.string().trim().min(1).max(400),
  season_label: z.string().trim().min(1).max(80),
  level_label: z.string().trim().min(1).max(80),
  price_per_person_cents: centsSchema.optional(),
  price_per_group_cents: centsSchema.optional(),
  internal_notes: nullableText(2000).optional(),
}

export const SeminarActivityCreateSchema = z.object(activityFields).strict()

export const SeminarActivityPatchSchema = z.object({
  ...Object.fromEntries(Object.entries(activityFields).map(([key, schema]) => [key, schema.optional()])) as {
    [K in keyof typeof activityFields]: z.ZodOptional<(typeof activityFields)[K]>
  },
  is_published: z.boolean().optional(),
}).strict()

export const SeminarActivityProvidersSchema = z.object({
  providers: z.array(z.object({
    poi_id: z.string().uuid(),
    notes: nullableText(1000).optional(),
  }).strict()).max(50).refine(
    providers => new Set(providers.map(provider => provider.poi_id)).size === providers.length,
    'Un prestataire est présent deux fois',
  ),
}).strict()

export const SeminarActivityPlacementsSchema = z.object({
  include_hub: z.boolean(),
  destination_ids: z.array(z.string().uuid()).max(200).transform(ids => [...new Set(ids)]),
}).strict()

export const SeminarPlacementOrderSchema = z.object({
  surface_key: z.union([z.literal('hub'), z.string().uuid()]),
  activity_ids: z.array(z.string().uuid()).max(200),
}).strict()

export const ProviderSearchSchema = z.object({ q: z.string().trim().min(2).max(80) })

export const UuidSchema = z.string().uuid()

export type SeminarActivityCreate = z.infer<typeof SeminarActivityCreateSchema>
export type SeminarActivityPatch = z.infer<typeof SeminarActivityPatchSchema>
export type SeminarActivityProvidersInput = z.infer<typeof SeminarActivityProvidersSchema>
export type SeminarActivityPlacementsInput = z.infer<typeof SeminarActivityPlacementsSchema>
export type SeminarPlacementOrderInput = z.infer<typeof SeminarPlacementOrderSchema>
