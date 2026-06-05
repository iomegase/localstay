import { Prisma } from '@prisma/client'
import { prisma } from '@/shared/lib/prisma'
import { TrailsAcquisitionError } from '../lib/errors'
import { createTrailSlug } from '../lib/slug'
import { mapTrailCandidate } from './runs'
import { extractCamptocampImageUrls } from '../services/camptocamp'
import { classifyTrailQuality } from '../lib/geometry-quality'

function extractPhotosForCandidate(primarySourceType: string, rawPayload: Prisma.JsonValue): string[] {
  if (primarySourceType === 'camptocamp') return extractCamptocampImageUrls(rawPayload)
  return []
}

type PublishOptions = {
  confirm_duplicate: boolean
  confirm_incomplete_geometry: boolean
}

type TrailCandidateAudit = {
  id: string
  review_status: string
  published_poi_id: string | null
  trail_detail_id: string | null
  admin_note: string | null
}

export async function publishTrailCandidate(candidateId: string, adminId: string, options: PublishOptions) {
  const candidate = await prisma.trailCandidate.findFirst({
    where: { id: candidateId, deleted_at: null },
    include: {
      city: true,
    },
  })

  if (!candidate || candidate.review_status !== 'needs_review') {
    throw new TrailsAcquisitionError('CANDIDATE_NOT_REVIEWABLE', 409)
  }
  if (!candidate.city.is_active || candidate.city.deleted_at) {
    throw new TrailsAcquisitionError('INVALID_CITY', 400)
  }
  if (candidate.start_latitude === null || candidate.start_longitude === null) {
    throw new TrailsAcquisitionError('TRAIL_START_POINT_REQUIRED', 409)
  }
  if (candidate.geometry_status !== 'valid' && !options.confirm_incomplete_geometry) {
    throw new TrailsAcquisitionError('TRAIL_GEOMETRY_REQUIRED', 409)
  }
  if (candidate.duplicate_poi_ids.length > 0 && !options.confirm_duplicate) {
    throw new TrailsAcquisitionError('DUPLICATE_TRAIL_CANDIDATE', 409, {
      duplicates: candidate.duplicate_poi_ids,
    })
  }

  const randoCategory = await prisma.category.findFirst({
    where: { slug: 'rando', is_active: true, deleted_at: null },
    select: { id: true },
  })
  if (!randoCategory) throw new TrailsAcquisitionError('INVALID_RANDO_CATEGORY', 400)

  // Le statut publié reflète la *qualité réelle* de la géométrie (densité, sauts, héritage),
  // pas seulement la présence d'une géométrie. Voir plan 2026-06-05 (Phase B).
  const qualityStatus = classifyTrailQuality({
    geometry: candidate.geometry_geojson,
    sourceRefs: candidate.source_refs,
  })
  const difficulty = candidate.difficulty ?? 'unknown'
  const startLatitude = candidate.start_latitude
  const startLongitude = candidate.start_longitude

  return prisma.$transaction(async tx => {
    const poi = await tx.pointOfInterest.create({
      data: {
        name: candidate.title,
        slug: await uniqueSlug(tx, candidate.city_id, createTrailSlug(candidate.title)),
        description: candidate.description,
        address: candidate.start_label ?? candidate.city.name,
        latitude: startLatitude,
        longitude: startLongitude,
        photos: extractPhotosForCandidate(candidate.primary_source_type, candidate.raw_payload),
        tags: ['rando'],
        geocode_status: 'success',
        geocoded_at: new Date(),
        geocode_provider: candidate.primary_source_type === 'manual' ? 'manual' : candidate.primary_source_type,
        is_active: true,
        city_id: candidate.city_id,
        category_id: randoCategory.id,
      },
    })

    const trailDetail = await tx.trailDetail.create({
      data: {
        poi_id: poi.id,
        difficulty,
        distance_km: candidate.distance_km,
        elevation_gain_m: candidate.elevation_gain_m,
        estimated_duration_min: candidate.estimated_duration_min,
        loop_type: candidate.loop_type,
        activity_type: candidate.activity_type,
        data_quality_status: qualityStatus,
        start_label: candidate.start_label,
        start_latitude: startLatitude,
        start_longitude: startLongitude,
        geometry_geojson: candidate.geometry_geojson ?? Prisma.JsonNull,
        primary_source_type: candidate.primary_source_type,
        source_refs: jsonInput(candidate.source_refs),
        metric_source: candidate.metric_source,
        parking_info: candidate.parking_info,
        kids_friendly: candidate.kids_friendly,
        pets_friendly: candidate.pets_friendly,
        best_season: candidate.best_season,
        is_active: true,
      },
    })

    const updated = await tx.trailCandidate.update({
      where: { id: candidate.id },
      data: {
        review_status: 'published',
        published_poi_id: poi.id,
        trail_detail_id: trailDetail.id,
        data_quality_status: qualityStatus,
        reviewed_by: adminId,
        reviewed_at: new Date(),
      },
      select: trailCandidateSelect,
    })

    await tx.trailAuditLog.create({
      data: {
        admin_id: adminId,
        action: 'candidate_published',
        target_type: 'TrailCandidate',
        target_id: candidate.id,
        before: candidateAudit(candidate),
        after: candidateAudit(updated),
      },
    })

    return mapTrailCandidate(updated)
  })
}

export async function mergeTrailCandidate(candidateId: string, poiId: string, adminId: string) {
  const candidate = await prisma.trailCandidate.findFirst({
    where: { id: candidateId, deleted_at: null },
  })
  if (!candidate || candidate.review_status !== 'needs_review') {
    throw new TrailsAcquisitionError('CANDIDATE_NOT_REVIEWABLE', 409)
  }

  const poi = await prisma.pointOfInterest.findFirst({
    where: { id: poiId, is_active: true, deleted_at: null },
    select: { id: true, trail_detail: { select: { id: true, is_active: true, deleted_at: true } } },
  })
  if (!poi || !poi.trail_detail || !poi.trail_detail.is_active || poi.trail_detail.deleted_at) {
    throw new TrailsAcquisitionError('NOT_FOUND', 404)
  }
  const trailDetail = poi.trail_detail

  return prisma.$transaction(async tx => {
    const updated = await tx.trailCandidate.update({
      where: { id: candidate.id },
      data: {
        review_status: 'merged',
        published_poi_id: poi.id,
        trail_detail_id: trailDetail.id,
        reviewed_by: adminId,
        reviewed_at: new Date(),
      },
      select: trailCandidateSelect,
    })

    await tx.trailAuditLog.create({
      data: {
        admin_id: adminId,
        action: 'candidate_merged',
        target_type: 'TrailCandidate',
        target_id: candidate.id,
        before: candidateAudit(candidate),
        after: candidateAudit(updated),
      },
    })

    return mapTrailCandidate(updated)
  })
}

export async function rejectTrailCandidate(candidateId: string, adminId: string, adminNote?: string | null) {
  const candidate = await prisma.trailCandidate.findFirst({
    where: { id: candidateId, deleted_at: null },
  })
  if (!candidate || candidate.review_status !== 'needs_review') {
    throw new TrailsAcquisitionError('CANDIDATE_NOT_REVIEWABLE', 409)
  }

  const now = new Date()
  return prisma.$transaction(async tx => {
    const updated = await tx.trailCandidate.update({
      where: { id: candidate.id },
      data: {
        review_status: 'rejected',
        reviewed_by: adminId,
        reviewed_at: now,
        admin_note: adminNote ?? null,
        deleted_at: now,
      },
      select: trailCandidateSelect,
    })

    await tx.trailAuditLog.create({
      data: {
        admin_id: adminId,
        action: 'candidate_rejected',
        target_type: 'TrailCandidate',
        target_id: candidate.id,
        before: candidateAudit(candidate),
        after: candidateAudit(updated),
      },
    })

    return mapTrailCandidate(updated)
  })
}

export type TrailCandidateUpdateInput = {
  title?: string
  description?: string | null
  difficulty?: string | null
  start_label?: string | null
  distance_km?: number | null
  elevation_gain_m?: number | null
  estimated_duration_min?: number | null
}

export async function updateTrailCandidate(
  candidateId: string,
  adminId: string,
  input: TrailCandidateUpdateInput,
) {
  const candidate = await prisma.trailCandidate.findFirst({
    where: { id: candidateId, deleted_at: null },
    select: trailCandidateSelect,
  })
  if (!candidate || candidate.review_status !== 'needs_review') {
    throw new TrailsAcquisitionError('CANDIDATE_NOT_REVIEWABLE', 409)
  }

  const data: Prisma.TrailCandidateUpdateInput = {}
  if (input.title !== undefined) data.title = input.title
  if (input.description !== undefined) data.description = input.description
  if (input.difficulty !== undefined) data.difficulty = input.difficulty
  if (input.start_label !== undefined) data.start_label = input.start_label
  if (input.distance_km !== undefined) data.distance_km = input.distance_km
  if (input.elevation_gain_m !== undefined) {
    data.elevation_gain_m = input.elevation_gain_m
    data.elevation_status = input.elevation_gain_m == null ? 'missing' : 'valid'
  }
  if (input.estimated_duration_min !== undefined) data.estimated_duration_min = input.estimated_duration_min

  if (Object.keys(data).length === 0) return mapTrailCandidate(candidate)

  return prisma.$transaction(async tx => {
    const updated = await tx.trailCandidate.update({
      where: { id: candidate.id },
      data,
      select: trailCandidateSelect,
    })

    await tx.trailAuditLog.create({
      data: {
        admin_id: adminId,
        action: 'candidate_edited',
        target_type: 'TrailCandidate',
        target_id: candidate.id,
        before: { fields: Object.keys(data) } as Prisma.InputJsonObject,
        after: { fields: Object.keys(data) } as Prisma.InputJsonObject,
      },
    })

    return mapTrailCandidate(updated)
  })
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
  admin_note: true,
} satisfies Prisma.TrailCandidateSelect

async function uniqueSlug(tx: Prisma.TransactionClient, cityId: string, baseSlug: string): Promise<string> {
  let suffix = 0
  let slug = baseSlug || 'randonnee'

  while (await tx.pointOfInterest.findFirst({ where: { city_id: cityId, slug }, select: { id: true } })) {
    suffix += 1
    slug = `${baseSlug || 'randonnee'}-${suffix}`
  }

  return slug
}

function candidateAudit(candidate: TrailCandidateAudit): Prisma.InputJsonObject {
  return {
    id: candidate.id,
    review_status: candidate.review_status,
    published_poi_id: candidate.published_poi_id,
    trail_detail_id: candidate.trail_detail_id,
    admin_note: candidate.admin_note,
  }
}

function jsonInput(value: Prisma.JsonValue): Prisma.InputJsonValue {
  return value === null ? [] : value
}
