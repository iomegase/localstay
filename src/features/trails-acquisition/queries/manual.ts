import { Prisma } from '@prisma/client'
import { prisma } from '@/shared/lib/prisma'
import { parseGpxToGeoJson } from '../lib/gpx'
import { validateTrailGeometry } from '../lib/geojson'
import { createTrailSlug } from '../lib/slug'
import { TrailsAcquisitionError } from '../lib/errors'
import { mapTrailCandidate } from './runs'
import type { TrailManualCandidateCreateSchema } from '../schemas'
import type { z } from 'zod'

type ManualTrailInput = z.infer<typeof TrailManualCandidateCreateSchema>

export async function createManualTrailCandidate(input: ManualTrailInput, adminId: string) {
  const city = await prisma.city.findFirst({
    where: { id: input.city_id, is_active: true, deleted_at: null },
    select: { id: true },
  })
  if (!city) throw new TrailsAcquisitionError('INVALID_CITY', 400)

  const geometry = resolveManualGeometry(input)
  const sourceRefs = input.source_refs && input.source_refs.length > 0
    ? input.source_refs
    : [{
        type: 'manual' as const,
        name: 'Saisie Super-admin MyStay',
        attribution: 'MyStay',
        used_for: ['manual_review' as const],
      }]

  const candidate = await prisma.$transaction(async tx => {
    const created = await tx.trailCandidate.create({
      data: {
        city_id: city.id,
        primary_source_type: 'manual',
        source_refs: sourceRefs,
        raw_payload: Prisma.JsonNull,
        title: input.title,
        slug: createTrailSlug(input.title),
        description: input.description ?? null,
        difficulty: input.difficulty,
        distance_km: input.distance_km ?? null,
        elevation_gain_m: input.elevation_gain_m ?? null,
        estimated_duration_min: input.estimated_duration_min ?? null,
        data_quality_status: geometry ? 'complete' : 'incomplete',
        start_label: input.start_label ?? null,
        start_latitude: input.start_latitude,
        start_longitude: input.start_longitude,
        geometry_geojson: geometry ?? Prisma.JsonNull,
        metric_source: 'manual',
        geometry_status: geometry ? 'valid' : 'missing',
        elevation_status: input.elevation_gain_m === null || input.elevation_gain_m === undefined ? 'missing' : 'valid',
        duplicate_poi_ids: [],
        review_status: 'needs_review',
      },
      select: trailCandidateSelect,
    })

    await tx.trailAuditLog.create({
      data: {
        admin_id: adminId,
        action: 'import_started',
        target_type: 'TrailCandidate',
        target_id: created.id,
        after: {
          id: created.id,
          title: created.title,
          primary_source_type: created.primary_source_type,
          review_status: created.review_status,
        },
      },
    })

    return created
  })

  return mapTrailCandidate(candidate)
}

function resolveManualGeometry(input: ManualTrailInput): Prisma.InputJsonValue | null {
  if (input.gpx_xml) {
    const parsed = parseGpxToGeoJson(input.gpx_xml)
    return parsed.geometry as Prisma.InputJsonObject
  }

  if (!input.geometry_geojson) return null
  const validation = validateTrailGeometry(input.geometry_geojson)
  if (validation.status !== 'valid') throw new TrailsAcquisitionError('TRAIL_GEOMETRY_REQUIRED', 400)
  return validation.geometry
}

const trailCandidateSelect = {
  id: true,
  title: true,
  description: true,
  primary_source_type: true,
  source_refs: true,
  difficulty: true,
  distance_km: true,
  elevation_gain_m: true,
  estimated_duration_min: true,
  data_quality_status: true,
  start_label: true,
  start_latitude: true,
  start_longitude: true,
  geometry_status: true,
  elevation_status: true,
  duplicate_poi_ids: true,
  review_status: true,
  published_poi_id: true,
  trail_detail_id: true,
} satisfies Prisma.TrailCandidateSelect
