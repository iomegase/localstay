import { Prisma } from '@prisma/client'
import { prisma } from '@/shared/lib/prisma'
import { assertAllowedTrailSource } from '../lib/source-policy'
import { TrailsAcquisitionError } from '../lib/errors'
import { collectTrailCandidatesFromSources } from '../services/run-orchestrator'
import type {
  TrailCandidateDto,
  TrailDataQualityStatus,
  TrailDifficulty,
  TrailElevationStatus,
  TrailGeometryStatus,
  TrailImportRunDetail,
  TrailImportRunListItem,
  TrailReviewStatus,
  TrailSourceRef,
  TrailSourceType,
} from '../types'

type RunCreateInput = {
  city_id: string
  source_types: TrailSourceType[]
  source_url?: string | null
  zone_radius_km?: number | null
}

type TrailCandidateRow = {
  id: string
  title: string
  description: string | null
  primary_source_type: string
  source_refs: Prisma.JsonValue
  difficulty: string | null
  distance_km: number | null
  elevation_gain_m: number | null
  estimated_duration_min: number | null
  data_quality_status: string
  start_label: string | null
  start_latitude: number | null
  start_longitude: number | null
  geometry_status: string
  elevation_status: string
  duplicate_poi_ids: string[]
  review_status: string
  published_poi_id?: string | null
  trail_detail_id?: string | null
}

export async function createTrailImportRun(
  input: RunCreateInput,
  adminId: string,
): Promise<TrailImportRunDetail> {
  const city = await prisma.city.findFirst({
    where: { id: input.city_id, is_active: true, deleted_at: null },
    select: { id: true, name: true, latitude: true, longitude: true },
  })
  if (!city) throw new TrailsAcquisitionError('INVALID_CITY', 400)

  if (input.source_types.includes('official_website')) {
    if (!input.source_url) throw new TrailsAcquisitionError('SOURCE_NOT_ALLOWED', 400)
    assertAllowedTrailSource(input.source_url)
  }

  const run = await prisma.trailImportRun.create({
    data: {
      city_id: city.id,
      status: 'running',
      source_types: input.source_types,
      source_url: input.source_url ?? null,
      zone_radius_km: input.zone_radius_km ?? null,
      started_by: adminId,
    },
    select: { id: true },
  })

  const sourceResult = await collectTrailCandidatesFromSources({
    city,
    sourceTypes: input.source_types,
    sourceUrl: input.source_url,
    zoneRadiusKm: input.zone_radius_km,
  })

  for (const candidate of sourceResult.candidates) {
    await prisma.trailCandidate.create({
      data: {
        run_id: run.id,
        city_id: city.id,
        primary_source_type: candidate.primary_source_type,
        source_refs: candidate.source_refs,
        raw_payload: candidate.raw_payload,
        title: candidate.title,
        description: candidate.description,
        difficulty: candidate.difficulty ?? null,
        distance_km: candidate.distance_km ?? null,
        elevation_gain_m: candidate.elevation_gain_m ?? null,
        estimated_duration_min: candidate.estimated_duration_min ?? null,
        loop_type: candidate.loop_type ?? null,
        start_label: candidate.start_label ?? null,
        start_latitude: candidate.start_latitude ?? null,
        start_longitude: candidate.start_longitude ?? null,
        geometry_geojson: candidate.geometry_geojson ?? Prisma.JsonNull,
        metric_source: candidate.metric_source ?? null,
        geometry_status: candidate.geometry_status ?? 'missing',
        elevation_status: candidate.elevation_status ?? 'missing',
        data_quality_status: candidate.data_quality_status ?? 'draft',
        duplicate_poi_ids: [],
        review_status: 'needs_review',
      },
    })
  }

  const sourceErrorCount = Object.keys(sourceResult.source_errors).length
  const status = sourceErrorCount > 0
    ? sourceResult.candidates.length > 0 ? 'partial_success' : 'failed'
    : 'completed'

  await prisma.trailImportRun.update({
    where: { id: run.id },
    data: {
      status,
      source_errors: sourceErrorCount > 0 ? sourceResult.source_errors : Prisma.JsonNull,
      error: status === 'failed' ? 'Toutes les sources ont échoué' : null,
    },
  })

  await prisma.trailAuditLog.create({
    data: {
      admin_id: adminId,
      action: 'import_started',
      target_type: 'TrailImportRun',
      target_id: run.id,
      after: { source_types: input.source_types, status },
    },
  })

  const detail = await getTrailImportRun(run.id)
  if (!detail) throw new TrailsAcquisitionError('NOT_FOUND', 404)
  return detail
}

export async function deleteTrailImportRun(id: string, adminId: string): Promise<void> {
  const run = await prisma.trailImportRun.findFirst({
    where: { id, deleted_at: null },
    select: { id: true },
  })
  if (!run) throw new TrailsAcquisitionError('NOT_FOUND', 404)

  const now = new Date()
  await prisma.$transaction([
    prisma.trailCandidate.updateMany({
      where: { run_id: id, deleted_at: null },
      data: { deleted_at: now },
    }),
    prisma.trailImportRun.update({
      where: { id },
      data: { deleted_at: now },
    }),
    prisma.trailAuditLog.create({
      data: {
        admin_id: adminId,
        action: 'import_deleted',
        target_type: 'TrailImportRun',
        target_id: id,
      },
    }),
  ])
}

export async function listTrailImportRuns(): Promise<TrailImportRunListItem[]> {
  const runs = await prisma.trailImportRun.findMany({
    where: { deleted_at: null },
    orderBy: { created_at: 'desc' },
    take: 50,
    select: {
      id: true,
      status: true,
      source_types: true,
      error: true,
      source_errors: true,
      created_at: true,
      city: { select: { name: true } },
      candidates: {
        where: { deleted_at: null },
        select: { review_status: true },
      },
    },
  })

  return runs.map(run => ({
    id: run.id,
    status: run.status,
    city_name: run.city.name,
    source_types: run.source_types as TrailSourceType[],
    candidate_count: run.candidates.length,
    needs_review_count: run.candidates.filter(candidate => candidate.review_status === 'needs_review').length,
    published_count: run.candidates.filter(candidate => candidate.review_status === 'published').length,
    error: run.error,
    source_errors: toStringRecord(run.source_errors),
    created_at: run.created_at.toISOString(),
  }))
}

export async function getTrailImportRun(id: string): Promise<TrailImportRunDetail | null> {
  const run = await prisma.trailImportRun.findFirst({
    where: { id, deleted_at: null },
    select: {
      id: true,
      status: true,
      source_types: true,
      error: true,
      source_errors: true,
      city: { select: { name: true } },
      candidates: {
        where: { deleted_at: null },
        orderBy: { created_at: 'asc' },
        select: {
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
        },
      },
    },
  })

  if (!run) return null

  return {
    id: run.id,
    status: run.status,
    city_name: run.city.name,
    source_types: run.source_types as TrailSourceType[],
    error: run.error,
    source_errors: toStringRecord(run.source_errors),
    candidates: run.candidates.map(candidate => mapTrailCandidate(candidate as TrailCandidateRow)),
  }
}

export function mapTrailCandidate(candidate: TrailCandidateRow): TrailCandidateDto {
  return {
    id: candidate.id,
    title: candidate.title,
    description: candidate.description,
    primary_source_type: candidate.primary_source_type as TrailSourceType,
    source_refs: toSourceRefs(candidate.source_refs),
    difficulty: candidate.difficulty as TrailDifficulty | null,
    distance_km: candidate.distance_km,
    elevation_gain_m: candidate.elevation_gain_m,
    estimated_duration_min: candidate.estimated_duration_min,
    data_quality_status: candidate.data_quality_status as TrailDataQualityStatus,
    start_label: candidate.start_label,
    start_latitude: candidate.start_latitude,
    start_longitude: candidate.start_longitude,
    geometry_status: candidate.geometry_status as TrailGeometryStatus,
    elevation_status: candidate.elevation_status as TrailElevationStatus,
    duplicate_poi_ids: candidate.duplicate_poi_ids,
    review_status: candidate.review_status as TrailReviewStatus,
    published_poi_id: candidate.published_poi_id ?? null,
    trail_detail_id: candidate.trail_detail_id ?? null,
  }
}

export function toSourceRefs(value: Prisma.JsonValue): TrailSourceRef[] {
  return Array.isArray(value) ? value.filter(isTrailSourceRef) : []
}

function isTrailSourceRef(value: unknown): value is TrailSourceRef {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return (
    typeof record.type === 'string' &&
    typeof record.attribution === 'string' &&
    Array.isArray(record.used_for) &&
    record.used_for.every(item => typeof item === 'string')
  )
}

function toStringRecord(value: Prisma.JsonValue | null): Record<string, string> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const entries = Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  return entries.length > 0 ? Object.fromEntries(entries) : null
}
