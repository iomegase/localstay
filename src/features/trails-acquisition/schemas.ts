import { z } from 'zod'
import {
  TRAIL_DIFFICULTIES,
  TRAIL_SOURCE_TYPES,
  TRAIL_SOURCE_USES,
} from './types'

export const TrailImportRunCreateSchema = z.object({
  city_id: z.string().uuid(),
  source_types: z.array(z.enum(TRAIL_SOURCE_TYPES)).min(1),
  source_url: z.string().url().nullable().optional(),
  zone_radius_km: z.number().positive().max(30).nullable().optional(),
})

export const TrailSourceRefSchema = z.object({
  type: z.enum(TRAIL_SOURCE_TYPES),
  name: z.string().trim().max(160).nullable().optional(),
  url: z.string().url().nullable().optional(),
  attribution: z.string().trim().min(1).max(300),
  used_for: z.array(z.enum(TRAIL_SOURCE_USES)).min(1),
})

export const TrailManualCandidateCreateSchema = z.object({
  city_id: z.string().uuid(),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  difficulty: z.enum(TRAIL_DIFFICULTIES),
  start_label: z.string().trim().max(200).nullable().optional(),
  start_latitude: z.number().min(-90).max(90),
  start_longitude: z.number().min(-180).max(180),
  distance_km: z.number().positive().nullable().optional(),
  elevation_gain_m: z.number().int().min(0).nullable().optional(),
  estimated_duration_min: z.number().int().positive().nullable().optional(),
  source_refs: z.array(TrailSourceRefSchema).min(1).optional(),
  geometry_geojson: z.unknown().nullable().optional(),
  gpx_xml: z.string().trim().max(500_000).nullable().optional(),
})

export const TrailPublishSchema = z.object({
  confirm_duplicate: z.boolean().default(false),
  confirm_incomplete_geometry: z.boolean().default(false),
})

export const TrailMergeSchema = z.object({
  poi_id: z.string().uuid(),
})

export const TrailRejectSchema = z.object({
  admin_note: z.string().max(500).nullable().optional(),
})
