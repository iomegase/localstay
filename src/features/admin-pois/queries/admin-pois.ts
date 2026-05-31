import { Prisma } from '@prisma/client'
import { prisma } from '@/shared/lib/prisma'
import { geocodeForAcquisition } from '@/features/poi-acquisition/lib/geocode'
import { PoiAcquisitionError } from '@/features/poi-acquisition/lib/errors'
import {
  fetchOfficialWebsitePhotoEnrichmentDetailed,
  mergeOfficialWebsitePhotos,
} from '@/features/poi-acquisition/services/official-website-photos'
import { buildAdminPoiWhere, getAdminPoiStatus } from '../lib/admin-poi-rules'
import type {
  AdminPoiAcquisitionRunSummary,
  AdminPoiCategory,
  AdminPoiDetail,
  AdminPoiKpis,
  AdminPoiListFilters,
  AdminPoiListItem,
  AdminPoiListResponse,
} from '../types'
import type { AdminPoiPatchInput } from '../lib/admin-poi-rules'

type AdminPoiRow = {
  id: string
  name: string
  slug: string
  description: string | null
  address: string
  latitude: number
  longitude: number
  phone: string | null
  website: string | null
  photos: string[]
  tags: string[]
  is_active: boolean
  deleted_at: Date | null
  geocode_status: string
  review_source: 'MANUAL' | 'GOOGLE'
  updated_at: Date
  city: { id: string; name: string; slug: string }
  category: { id: string; name: string; slug: string }
  subcategory: { id: string; name: string; slug: string } | null
  merchant_profile: { id: string } | null
  trail_detail: {
    id: string
    deleted_at: Date | null
    difficulty: string
    distance_km: number | null
    elevation_gain_m: number | null
    estimated_duration_min: number | null
  } | null
}

type AcquisitionRunRow = {
  id: string
  status: string
  created_at: Date
  category: { name: string }
  candidates: Array<{ review_status: string }>
}

const adminPoiSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  address: true,
  latitude: true,
  longitude: true,
  phone: true,
  website: true,
  photos: true,
  tags: true,
  is_active: true,
  deleted_at: true,
  geocode_status: true,
  review_source: true,
  updated_at: true,
  city: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
  subcategory: { select: { id: true, name: true, slug: true } },
  merchant_profile: { select: { id: true } },
  trail_detail: {
    select: {
      id: true,
      deleted_at: true,
      difficulty: true,
      distance_km: true,
      elevation_gain_m: true,
      estimated_duration_min: true,
    },
  },
} satisfies Prisma.PointOfInterestSelect

export async function getAdminPoiOptions(): Promise<{
  cities: Array<{ id: string; name: string; slug: string }>
  categories: AdminPoiCategory[]
}> {
  const [cities, categories] = await Promise.all([
    prisma.city.findMany({
      where: { is_active: true, deleted_at: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
    prisma.category.findMany({
      where: { is_active: true, deleted_at: null },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        subcategories: {
          where: { is_active: true, deleted_at: null },
          orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
          select: { id: true, name: true, slug: true },
        },
      },
    }),
  ])

  return { cities, categories }
}

export async function listAdminPois(filters: AdminPoiListFilters): Promise<AdminPoiListResponse> {
  const city = await prisma.city.findFirst({
    where: { id: filters.city_id, is_active: true, deleted_at: null },
    select: { id: true },
  })
  if (!city) throw new PoiAcquisitionError('INVALID_CITY', 400)

  const where = buildAdminPoiWhere(filters)
  const skip = (filters.page - 1) * filters.limit

  const [rows, total, kpis, acquisitionRuns] = await Promise.all([
    prisma.pointOfInterest.findMany({
      where,
      orderBy: [{ updated_at: 'desc' }, { name: 'asc' }],
      skip,
      take: filters.limit,
      select: adminPoiSelect,
    }),
    prisma.pointOfInterest.count({ where }),
    getAdminPoiKpis(filters.city_id),
    getAdminPoiAcquisitionRuns(filters.city_id),
  ])

  return {
    data: (rows as AdminPoiRow[]).map(mapAdminPoiListItem),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      total_pages: Math.ceil(total / filters.limit),
    },
    kpis,
    acquisition_runs: acquisitionRuns,
  }
}

export async function getAdminPoi(id: string): Promise<AdminPoiDetail | null> {
  const row = await prisma.pointOfInterest.findFirst({
    where: { id },
    select: adminPoiSelect,
  })

  return row ? mapAdminPoiDetail(row as AdminPoiRow) : null
}

export async function updateAdminPoi(
  id: string,
  input: AdminPoiPatchInput,
  adminId: string,
): Promise<AdminPoiDetail> {
  const before = await getPoiForMutation(id)
  const targetCategoryId = input.category_id ?? before.category_id

  await validatePoiDependencies({
    cityId: before.city_id,
    categoryId: targetCategoryId,
    subcategoryId: input.subcategory_id === undefined ? before.subcategory_id : input.subcategory_id,
  })

  if (input.is_active === true) {
    if (before.deleted_at) throw new PoiAcquisitionError('POI_DELETED', 409)
    if (before.geocode_status === 'rejected') throw new PoiAcquisitionError('MAPBOX_GEOCODE_FAILED', 409)
  }

  const data: Prisma.PointOfInterestUpdateInput = {}
  if (input.name !== undefined) data.name = input.name
  if (input.description !== undefined) data.description = input.description
  if (input.phone !== undefined) data.phone = input.phone
  if (input.website !== undefined) data.website = input.website
  if (input.tags !== undefined) data.tags = input.tags
  if (input.photos !== undefined) data.photos = input.photos
  if (input.is_active !== undefined) data.is_active = input.is_active
  if (input.category_id !== undefined) data.category = { connect: { id: input.category_id } }
  if (input.subcategory_id !== undefined) {
    data.subcategory = input.subcategory_id ? { connect: { id: input.subcategory_id } } : { disconnect: true }
  }

  // Sous-ensemble rando éditable (distance / difficulté / durée / dénivelé). On met à jour
  // le TrailDetail lié uniquement pour les champs fournis ; le reste du tracé reste intact.
  if (input.trail_metrics) {
    const metrics = input.trail_metrics
    const trailData: Prisma.TrailDetailUpdateInput = {}
    if (metrics.difficulty !== undefined) trailData.difficulty = metrics.difficulty
    if (metrics.distance_km !== undefined) trailData.distance_km = metrics.distance_km
    if (metrics.elevation_gain_m !== undefined) trailData.elevation_gain_m = metrics.elevation_gain_m
    if (metrics.estimated_duration_min !== undefined) trailData.estimated_duration_min = metrics.estimated_duration_min
    if (Object.keys(trailData).length > 0) {
      data.trail_detail = { update: trailData }
    }
  }

  const addressForGeocode = input.address ?? before.address
  const shouldGeocode = Boolean(input.address && input.address !== before.address) || input.force_geocode

  if (shouldGeocode) {
    const geocode = await geocodeForAcquisition(addressForGeocode, {
      latitude: before.city.latitude,
      longitude: before.city.longitude,
    })

    if (geocode.status === 'failed' || geocode.status === 'rejected') {
      throw new PoiAcquisitionError('MAPBOX_GEOCODE_FAILED', 409, { reason: geocode.reason })
    }
    if (geocode.status === 'pending_review' && !input.confirm_geocode_pending_review) {
      throw new PoiAcquisitionError('MAPBOX_GEOCODE_AMBIGUOUS', 409, {
        latitude: geocode.latitude,
        longitude: geocode.longitude,
        confidence: geocode.confidence,
        reason: geocode.reason,
      })
    }

    data.address = addressForGeocode
    data.latitude = geocode.latitude
    data.longitude = geocode.longitude
    data.geocode_status = geocode.status
    data.geocoded_at = new Date()
    data.geocode_provider = 'mapbox'
    data.geocode_error = null
    data.geocode_attempts = { increment: 1 }
  }

  const updated = await prisma.$transaction(async tx => {
    const poi = await tx.pointOfInterest.update({
      where: { id },
      data,
      select: adminPoiSelect,
    })
    await tx.poiAcquisitionAuditLog.create({
      data: {
        admin_id: adminId,
        action: 'poi_updated',
        target_type: 'poi',
        target_id: id,
        before: buildAuditSnapshot(before),
        after: buildAuditSnapshot(poi),
      },
    })
    return poi
  })

  return mapAdminPoiDetail(updated as AdminPoiRow)
}

export async function disableAdminPoi(id: string, adminId: string): Promise<AdminPoiDetail> {
  const before = await getPoiForMutation(id)
  const updated = await prisma.$transaction(async tx => {
    const poi = await tx.pointOfInterest.update({
      where: { id },
      data: { is_active: false, deleted_at: null },
      select: adminPoiSelect,
    })
    await tx.poiAcquisitionAuditLog.create({
      data: {
        admin_id: adminId,
        action: 'poi_disabled',
        target_type: 'poi',
        target_id: id,
        before: buildAuditSnapshot(before),
        after: buildAuditSnapshot(poi),
      },
    })
    return poi
  })
  return mapAdminPoiDetail(updated as AdminPoiRow)
}

export async function deleteAdminPoi(id: string, adminId: string): Promise<AdminPoiDetail> {
  const before = await getPoiForMutation(id)
  if (before.deleted_at) throw new PoiAcquisitionError('POI_ALREADY_DELETED', 409)

  const updated = await prisma.$transaction(async tx => {
    const poi = await tx.pointOfInterest.update({
      where: { id },
      data: { is_active: false, deleted_at: new Date() },
      select: adminPoiSelect,
    })
    await tx.poiAcquisitionAuditLog.create({
      data: {
        admin_id: adminId,
        action: 'poi_deleted',
        target_type: 'poi',
        target_id: id,
        before: buildAuditSnapshot(before),
        after: buildAuditSnapshot(poi),
      },
    })
    return poi
  })
  return mapAdminPoiDetail(updated as AdminPoiRow)
}

export async function restoreAdminPoi(id: string, adminId: string): Promise<AdminPoiDetail> {
  const before = await getPoiForMutation(id)
  if (!before.deleted_at) throw new PoiAcquisitionError('POI_NOT_DELETED', 409)

  await validatePoiDependencies({
    cityId: before.city_id,
    categoryId: before.category_id,
    subcategoryId: before.subcategory_id,
  })

  const updated = await prisma.$transaction(async tx => {
    const poi = await tx.pointOfInterest.update({
      where: { id },
      data: { is_active: false, deleted_at: null },
      select: adminPoiSelect,
    })
    await tx.poiAcquisitionAuditLog.create({
      data: {
        admin_id: adminId,
        action: 'poi_restored',
        target_type: 'poi',
        target_id: id,
        before: buildAuditSnapshot(before),
        after: buildAuditSnapshot(poi),
      },
    })
    return poi
  })
  return mapAdminPoiDetail(updated as AdminPoiRow)
}

export async function refreshAdminPoiOfficialPhotos(
  id: string,
  adminId: string,
): Promise<{ photos: string[]; photos_added: number; diagnostic: string }> {
  const before = await getPoiForMutation(id)
  const fetchResult = await fetchOfficialWebsitePhotoEnrichmentDetailed(before.website)

  const diagnostic = (() => {
    switch (fetchResult.status) {
      case 'ok': return `${fetchResult.enrichment.photos.length} URL(s) trouvée(s) sur ${fetchResult.enrichment.canonical_url}`
      case 'no_website': return 'Aucune URL website renseignée sur ce POI'
      case 'fetch_failed': return `Échec du fetch website : ${fetchResult.reason}`
      case 'not_html': return `Le website ne renvoie pas de HTML (content-type: ${fetchResult.contentType})`
      case 'no_photos_extracted': return `HTML lu sur ${fetchResult.canonicalUrl} mais aucune photo exploitable trouvée`
    }
  })()

  const enrichmentPhotos = fetchResult.status === 'ok' ? fetchResult.enrichment.photos : []
  const merged = mergeOfficialWebsitePhotos(before.photos, enrichmentPhotos)
  const photosAdded = merged.length - before.photos.length

  if (photosAdded === 0) {
    await prisma.poiAcquisitionAuditLog.create({
      data: {
        admin_id: adminId,
        action: 'poi_photos_refreshed',
        target_type: 'poi',
        target_id: id,
        before: { photos: before.photos },
        after: { photos: before.photos, photos_added: 0, diagnostic },
      },
    })
    return { photos: before.photos, photos_added: 0, diagnostic }
  }

  await prisma.$transaction(async tx => {
    await tx.pointOfInterest.update({
      where: { id },
      data: { photos: merged },
      select: { id: true },
    })
    await tx.poiAcquisitionAuditLog.create({
      data: {
        admin_id: adminId,
        action: 'poi_photos_refreshed',
        target_type: 'poi',
        target_id: id,
        before: { photos: before.photos },
        after: { photos: merged, photos_added: photosAdded, diagnostic },
      },
    })
  })

  return { photos: merged, photos_added: photosAdded, diagnostic }
}

async function getAdminPoiKpis(cityId: string): Promise<AdminPoiKpis> {
  const [active, inactive, archived, withoutPhotos, pendingGeocode] = await Promise.all([
    prisma.pointOfInterest.count({ where: { city_id: cityId, is_active: true, deleted_at: null } }),
    prisma.pointOfInterest.count({ where: { city_id: cityId, is_active: false, deleted_at: null } }),
    prisma.pointOfInterest.count({ where: { city_id: cityId, deleted_at: { not: null } } }),
    prisma.pointOfInterest.count({ where: { city_id: cityId, deleted_at: null, photos: { isEmpty: true } } }),
    prisma.pointOfInterest.count({
      where: { city_id: cityId, deleted_at: null, geocode_status: { not: 'success' } },
    }),
  ])

  return {
    active_count: active,
    inactive_count: inactive,
    archived_count: archived,
    without_photos_count: withoutPhotos,
    pending_geocode_count: pendingGeocode,
  }
}

async function getAdminPoiAcquisitionRuns(cityId: string): Promise<AdminPoiAcquisitionRunSummary[]> {
  const runs = await prisma.poiAcquisitionRun.findMany({
    where: { city_id: cityId, deleted_at: null },
    orderBy: { created_at: 'desc' },
    take: 5,
    select: {
      id: true,
      status: true,
      created_at: true,
      category: { select: { name: true } },
      candidates: {
        where: { deleted_at: null },
        select: { review_status: true },
      },
    },
  })

  return (runs as AcquisitionRunRow[]).map(run => ({
    id: run.id,
    status: run.status,
    category_name: run.category.name,
    candidate_count: run.candidates.length,
    needs_review_count: run.candidates.filter(candidate => candidate.review_status === 'needs_review').length,
    published_count: run.candidates.filter(candidate => candidate.review_status === 'published').length,
    created_at: run.created_at.toISOString(),
  }))
}

async function getPoiForMutation(id: string) {
  const poi = await prisma.pointOfInterest.findFirst({
    where: { id },
    select: {
      ...adminPoiSelect,
      city_id: true,
      category_id: true,
      subcategory_id: true,
      geocode_provider: true,
      geocoded_at: true,
      city: { select: { id: true, name: true, slug: true, latitude: true, longitude: true, is_active: true, deleted_at: true } },
    },
  })
  if (!poi) throw new PoiAcquisitionError('POI_NOT_FOUND', 404)
  return poi
}

async function validatePoiDependencies(input: {
  cityId: string
  categoryId: string
  subcategoryId: string | null
}): Promise<void> {
  const [city, category, subcategory] = await Promise.all([
    prisma.city.findFirst({
      where: { id: input.cityId, is_active: true, deleted_at: null },
      select: { id: true },
    }),
    prisma.category.findFirst({
      where: { id: input.categoryId, is_active: true, deleted_at: null },
      select: { id: true },
    }),
    input.subcategoryId
      ? prisma.subCategory.findFirst({
          where: {
            id: input.subcategoryId,
            category_id: input.categoryId,
            is_active: true,
            deleted_at: null,
          },
          select: { id: true },
        })
      : Promise.resolve(null),
  ])

  if (!city) throw new PoiAcquisitionError('INVALID_CITY', 400)
  if (!category) throw new PoiAcquisitionError('INVALID_CATEGORY', 400)
  if (input.subcategoryId && !subcategory) throw new PoiAcquisitionError('INVALID_SUBCATEGORY', 400)
}

function mapAdminPoiListItem(row: AdminPoiRow): AdminPoiListItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: getAdminPoiStatus(row),
    city: row.city,
    category: row.category,
    subcategory: row.subcategory,
    address: row.address,
    geocode_status: row.geocode_status,
    photo_count: row.photos.length,
    primary_photo_url: row.photos[0] ?? null,
    review_source: row.review_source,
    merchant_attached: Boolean(row.merchant_profile),
    has_trail_detail: Boolean(row.trail_detail && !row.trail_detail.deleted_at),
    updated_at: row.updated_at.toISOString(),
    public_url: `/guide/${row.city.slug}/${row.category.slug}/${row.slug}`,
  }
}

function mapAdminPoiDetail(row: AdminPoiRow): AdminPoiDetail {
  return {
    ...mapAdminPoiListItem(row),
    description: row.description,
    phone: row.phone,
    website: row.website,
    photos: row.photos,
    tags: row.tags,
    latitude: row.latitude,
    longitude: row.longitude,
    slug_editable: false,
    trail_fields_locked: Boolean(row.trail_detail && !row.trail_detail.deleted_at),
    trail_detail:
      row.trail_detail && !row.trail_detail.deleted_at
        ? {
            difficulty: row.trail_detail.difficulty,
            distance_km: row.trail_detail.distance_km,
            elevation_gain_m: row.trail_detail.elevation_gain_m,
            estimated_duration_min: row.trail_detail.estimated_duration_min,
          }
        : null,
  }
}

function buildAuditSnapshot(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}
