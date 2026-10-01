import { extractTrailPhotos } from '../lib/photos'
import { Prisma } from '@prisma/client'
import { prisma } from '@/shared/lib/prisma'
import { assertAllowedTrailSource } from '../lib/source-policy'
import { TrailsAcquisitionError } from '../lib/errors'
import { IMPORT_STALE_AFTER_MS } from '../lib/import-budget'
import { collectTrailCandidatesFromSources, type RunSourceResult } from '../services/run-orchestrator'
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
  raw_payload?: Prisma.JsonValue
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

  const cityId = city.id
  const saved = new Map<number, { id: string; updatedAt: Date }>()
  let lastErrors: Record<string, string> = {}
  async function checkpoint(result: RunSourceResult) {
    await prisma.$transaction(async tx => {
      const active = await tx.trailImportRun.updateMany({
        where: { id: run.id, status: 'running', deleted_at: null },
        data: { updated_at: new Date(), source_errors: Object.keys(result.source_errors).length ? result.source_errors : Prisma.JsonNull },
      })
      if (!active.count) throw new Error('Import interrompu ou supprimé')
      for (const [index, candidate] of result.candidates.entries()) {
        const updatedAt = new Date()
        const data = {
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
          updated_at: updatedAt,
        }
        const previous = saved.get(index)
        if (previous) {
          const updated = await tx.trailCandidate.updateMany({
            where: { id: previous.id, run_id: run.id, deleted_at: null, review_status: 'needs_review', updated_at: previous.updatedAt },
            data,
          })
          if (updated.count) saved.set(index, { id: previous.id, updatedAt })
        } else {
          const row = await tx.trailCandidate.create({
            data: { ...data, run_id: run.id, city_id: cityId, duplicate_poi_ids: [], review_status: 'needs_review' },
            select: { id: true },
          })
          saved.set(index, { id: row.id, updatedAt })
        }
      }
    }, { timeout: 30_000 })
    lastErrors = { ...result.source_errors }
  }

  try {
  await prisma.trailAuditLog.create({ data: {
    admin_id: adminId, action: 'import_started', target_type: 'TrailImportRun', target_id: run.id,
    after: { source_types: input.source_types },
  } })
    const sourceResult = await collectTrailCandidatesFromSources({
      city, sourceTypes: input.source_types, sourceUrl: input.source_url, zoneRadiusKm: input.zone_radius_km,
    }, checkpoint)
    const hasErrors = Object.keys(sourceResult.source_errors).length > 0
    const status = hasErrors ? (sourceResult.candidates.length ? 'partial_success' : 'failed') : 'completed'
    await prisma.trailImportRun.updateMany({
      where: { id: run.id, status: 'running', deleted_at: null },
      data: { status, source_errors: hasErrors ? sourceResult.source_errors : Prisma.JsonNull, error: status === 'failed' ? 'Toutes les sources ont échoué' : null },
    })
  } catch (error) {
    console.error('[trails-import] failed', { runId: run.id, error: error instanceof Error ? error.message : 'Unknown error' })
    const count = await prisma.trailCandidate.count({ where: { run_id: run.id, deleted_at: null } })
    await prisma.trailImportRun.updateMany({
      where: { id: run.id, status: 'running', deleted_at: null },
      data: {
        status: count > 0 ? 'partial_success' : 'failed',
        error: 'Import interrompu. Les candidats déjà enregistrés sont conservés. Vous pouvez relancer l’acquisition.',
        source_errors: { ...lastErrors, pipeline: 'Erreur pendant le traitement de l’import' },
      },
    })
  }

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
  await recoverStaleTrailImportRuns()
  const runs = await prisma.trailImportRun.findMany({
    where: { deleted_at: null },
    orderBy: { created_at: 'desc' },
    take: 50,
    select: {
      id: true,
      status: true,
      source_types: true,
      zone_radius_km: true,
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
    zone_radius_km: run.zone_radius_km,
    candidate_count: run.candidates.length,
    needs_review_count: run.candidates.filter(candidate => candidate.review_status === 'needs_review').length,
    published_count: run.candidates.filter(candidate => candidate.review_status === 'published').length,
    error: run.error,
    source_errors: toStringRecord(run.source_errors),
    created_at: run.created_at.toISOString(),
  }))
}

export async function getTrailImportRun(id: string): Promise<TrailImportRunDetail | null> {
  await recoverStaleTrailImportRuns(id)
  const run = await prisma.trailImportRun.findFirst({
    where: { id, deleted_at: null },
    select: {
      id: true,
      status: true,
      source_types: true,
      zone_radius_km: true,
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
    zone_radius_km: run.zone_radius_km,
    error: run.error,
    source_errors: toStringRecord(run.source_errors),
    candidates: run.candidates.map(candidate => mapTrailCandidate(candidate as TrailCandidateRow)),
  }
}

export function mapTrailCandidate(candidate: TrailCandidateRow): TrailCandidateDto {
  return {
    id: candidate.id,
    photos: extractTrailPhotos(candidate.raw_payload),
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


export async function recoverStaleTrailImportRuns(id?: string): Promise<number> {
  const cutoff = new Date(Date.now() - IMPORT_STALE_AFTER_MS)
  const stale = await prisma.trailImportRun.findMany({
    where: { ...(id ? { id } : {}), status: 'running', deleted_at: null, updated_at: { lt: cutoff } },
    select: { id: true, updated_at: true, source_errors: true, started_by: true },
  })
  let recovered = 0
  for (const run of stale) {
    // Compare the observed timestamp: a concurrent checkpoint takes precedence.
    await prisma.$transaction(async tx => {
      const count = await tx.trailCandidate.count({ where: { run_id: run.id, deleted_at: null } })
      const result = await tx.trailImportRun.updateMany({
        where: { id: run.id, status: 'running', deleted_at: null, updated_at: run.updated_at },
        data: {
          status: count > 0 ? 'partial_success' : 'failed',
          error: 'Import interrompu (aucune progression depuis 10 minutes). Les candidats enregistrés sont conservés. Relancez l’acquisition.',
          source_errors: { ...toStringRecord(run.source_errors), pipeline: 'IMPORT_INTERRUPTED' },
        },
      })
      if (result.count && run.started_by) {
        await tx.trailAuditLog.create({ data: {
          admin_id: run.started_by, action: 'import_interrupted', target_type: 'TrailImportRun', target_id: run.id,
          before: { status: 'running' }, after: { status: count > 0 ? 'partial_success' : 'failed', candidate_count: count },
        } })
      }
      recovered += result.count
    })
  }
  return recovered
}
