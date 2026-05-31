import { Prisma } from '@prisma/client'
import { z } from 'zod'
import type { AdminPoiListFilters, AdminPoiStatus } from '../types'

const UUID = z.string().uuid()

const trailLockedKeys = new Set([
  'trail_detail',
  'hiking_detail',
  'difficulty',
  'distance_km',
  'elevation_gain_m',
  'estimated_duration_min',
  'duration_minutes',
  'start_label',
  'start_latitude',
  'start_longitude',
  'starting_point',
  'geometry_geojson',
  'source_refs',
  'primary_source_type',
  'metric_source',
  'gpx_url',
  'loop_type',
  'activity_type',
  'data_quality_status',
  'parking_info',
  'kids_friendly',
  'pets_friendly',
  'best_season',
])

export const AdminPoiListQuerySchema = z.object({
  city_id: UUID,
  q: z.string().trim().min(1).max(120).optional(),
  category_id: UUID.optional(),
  subcategory_id: UUID.optional(),
  status: z.enum(['current', 'active', 'inactive', 'archived']).default('current'),
  geocode_status: z.string().trim().min(1).max(40).optional(),
  photo_status: z.enum(['with_photos', 'without_photos']).optional(),
  review_source: z.enum(['MANUAL', 'GOOGLE']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(10).max(100).default(25),
})

const nullableText = (maxLength: number) =>
  z.union([
    z.string().trim().max(maxLength).transform(value => (value.length === 0 ? null : value)),
    z.null(),
  ])

// Seul sous-ensemble rando éditable depuis le backoffice. Clé dédiée (hors trailLockedKeys)
// pour ne pas toucher au garde-fou métier : géométrie, tracé, sources et GPX restent verrouillés.
const TrailMetricsPatchSchema = z.object({
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert', 'unknown']).optional(),
  distance_km: z.union([z.number().positive().max(1000), z.null()]).optional(),
  elevation_gain_m: z.union([z.number().int().min(0).max(10000), z.null()]).optional(),
  estimated_duration_min: z.union([z.number().int().min(0).max(100000), z.null()]).optional(),
}).strict()

export type AdminPoiTrailMetricsPatch = z.infer<typeof TrailMetricsPatchSchema>

export const AdminPoiPatchSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  description: nullableText(2000).optional(),
  address: z.string().trim().min(5).max(255).optional(),
  phone: nullableText(40).optional(),
  website: z.union([z.string().trim().url(), z.null()]).optional(),
  category_id: UUID.optional(),
  subcategory_id: UUID.nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  photos: z.array(z.string().trim().url().refine(isUsableAdminPhotoUrl, 'Invalid photo URL')).max(12).optional(),
  is_active: z.boolean().optional(),
  trail_metrics: TrailMetricsPatchSchema.optional(),
  force_geocode: z.boolean().default(false),
  confirm_geocode_pending_review: z.boolean().default(false),
}).strict()

export type AdminPoiPatchInput = z.infer<typeof AdminPoiPatchSchema>

export function parseAdminPoiListFilters(input: unknown): z.SafeParseReturnType<unknown, AdminPoiListFilters> {
  return AdminPoiListQuerySchema.safeParse(input)
}

export function parseAdminPoiPatchInput(input: unknown): z.SafeParseReturnType<unknown, AdminPoiPatchInput> {
  return AdminPoiPatchSchema.safeParse(input)
}

export function getAdminPoiStatus(poi: { is_active: boolean; deleted_at: Date | null }): AdminPoiStatus {
  if (poi.deleted_at) return 'archived'
  return poi.is_active ? 'active' : 'inactive'
}

export function buildAdminPoiWhere(filters: Pick<
  AdminPoiListFilters,
  'city_id' | 'q' | 'category_id' | 'subcategory_id' | 'status' | 'geocode_status' | 'photo_status' | 'review_source'
>): Prisma.PointOfInterestWhereInput {
  const status = filters.status ?? 'current'
  const where: Prisma.PointOfInterestWhereInput = { city_id: filters.city_id }

  if (status === 'archived') {
    where.deleted_at = { not: null }
  } else {
    where.deleted_at = null
    if (status === 'active') where.is_active = true
    if (status === 'inactive') where.is_active = false
  }

  if (filters.category_id) where.category_id = filters.category_id
  if (filters.subcategory_id) where.subcategory_id = filters.subcategory_id
  if (filters.geocode_status) where.geocode_status = filters.geocode_status
  if (filters.review_source) where.review_source = filters.review_source
  if (filters.photo_status === 'with_photos') where.photos = { isEmpty: false }
  if (filters.photo_status === 'without_photos') where.photos = { isEmpty: true }

  const q = filters.q?.trim()
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { address: { contains: q, mode: 'insensitive' } },
    ]
  }

  return where
}

export function containsTrailLockedFields(input: unknown): boolean {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false
  return Object.keys(input).some(key => trailLockedKeys.has(key))
}

export function isUsableAdminPhotoUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    const normalized = parsed.toString().toLowerCase()
    if (!['http:', 'https:'].includes(parsed.protocol)) return false
    if (normalized.includes('favicon')) return false
    if (normalized.includes('no-image')) return false
    if (normalized.includes('placeholder')) return false
    if (normalized.includes('/blank/')) return false
    if (normalized.includes('logo')) return false
    if (normalized.endsWith('.svg')) return false
    return true
  } catch {
    return false
  }
}
