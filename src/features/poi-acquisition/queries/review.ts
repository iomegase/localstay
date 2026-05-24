import { Prisma } from '@prisma/client'
import { prisma } from '@/shared/lib/prisma'
import { PoiAcquisitionError } from '../lib/errors'
import { createPoiSlug } from '../lib/slug'

export async function publishCandidate(
  candidateId: string,
  adminId: string,
  options: { confirm_duplicate: boolean },
) {
  const candidate = await prisma.poiAcquisitionCandidate.findFirst({
    where: { id: candidateId, deleted_at: null },
    include: {
      run: {
        include: {
          city: true,
          category: true,
        },
      },
      subcategory: true,
    },
  })

  if (!candidate || candidate.review_status !== 'needs_review') {
    throw new PoiAcquisitionError('CANDIDATE_NOT_REVIEWABLE', 409)
  }
  if (candidate.geocode_status === 'rejected') {
    throw new PoiAcquisitionError('MAPBOX_GEOCODE_FAILED', 409)
  }
  if (candidate.duplicate_poi_ids.length > 0 && !options.confirm_duplicate) {
    throw new PoiAcquisitionError('DUPLICATE_POI_CANDIDATE', 409, {
      duplicates: candidate.duplicate_poi_ids,
    })
  }
  if (!candidate.run.city.is_active || candidate.run.city.deleted_at) {
    throw new PoiAcquisitionError('INVALID_CITY', 400)
  }
  if (!candidate.run.category.is_active || candidate.run.category.deleted_at) {
    throw new PoiAcquisitionError('INVALID_CATEGORY', 400)
  }
  if (candidate.subcategory && (!candidate.subcategory.is_active || candidate.subcategory.deleted_at)) {
    throw new PoiAcquisitionError('INVALID_SUBCATEGORY', 400)
  }
  if (candidate.latitude === null || candidate.longitude === null) {
    throw new PoiAcquisitionError('MAPBOX_GEOCODE_FAILED', 409)
  }

  const latitude = candidate.latitude
  const longitude = candidate.longitude

  return prisma.$transaction(async tx => {
    const poi = await tx.pointOfInterest.create({
      data: {
        name: candidate.name,
        slug: await uniqueSlug(tx, candidate.run.city_id, createPoiSlug(candidate.name)),
        description: candidate.description,
        address: candidate.address,
        latitude,
        longitude,
        phone: candidate.phone,
        website: candidate.website,
        photos: [],
        tags: [],
        google_place_id: candidate.google_place_id,
        geocode_status: candidate.geocode_status === 'success' ? 'success' : 'pending_review',
        geocoded_at: new Date(),
        geocode_provider: candidate.geocode_provider ?? 'mapbox',
        is_active: true,
        city_id: candidate.run.city_id,
        category_id: candidate.category_id,
        subcategory_id: candidate.subcategory_id,
      },
    })

    const updated = await tx.poiAcquisitionCandidate.update({
      where: { id: candidate.id },
      data: {
        review_status: 'published',
        published_poi_id: poi.id,
        reviewed_by: adminId,
        reviewed_at: new Date(),
      },
    })

    await tx.poiAcquisitionAuditLog.create({
      data: {
        admin_id: adminId,
        action: 'candidate_published',
        target_type: 'candidate',
        target_id: candidate.id,
        run_id: candidate.run_id,
        candidate_id: candidate.id,
        before: candidateAudit(candidate),
        after: candidateAudit(updated),
      },
    })

    return updated
  })
}

export async function mergeCandidate(candidateId: string, poiId: string, adminId: string) {
  const candidate = await prisma.poiAcquisitionCandidate.findFirst({
    where: { id: candidateId, deleted_at: null },
  })
  if (!candidate || candidate.review_status !== 'needs_review') {
    throw new PoiAcquisitionError('CANDIDATE_NOT_REVIEWABLE', 409)
  }

  const poi = await prisma.pointOfInterest.findFirst({
    where: { id: poiId, is_active: true, deleted_at: null },
    select: { id: true },
  })
  if (!poi) throw new PoiAcquisitionError('NOT_FOUND', 404)

  return prisma.$transaction(async tx => {
    const updated = await tx.poiAcquisitionCandidate.update({
      where: { id: candidate.id },
      data: {
        review_status: 'merged',
        published_poi_id: poi.id,
        reviewed_by: adminId,
        reviewed_at: new Date(),
      },
    })

    await tx.poiAcquisitionAuditLog.create({
      data: {
        admin_id: adminId,
        action: 'candidate_merged',
        target_type: 'candidate',
        target_id: candidate.id,
        run_id: candidate.run_id,
        candidate_id: candidate.id,
        before: candidateAudit(candidate),
        after: candidateAudit(updated),
      },
    })

    return updated
  })
}

export async function rejectCandidate(candidateId: string, adminId: string, adminNote?: string) {
  const candidate = await prisma.poiAcquisitionCandidate.findFirst({
    where: { id: candidateId, deleted_at: null },
  })
  if (!candidate || candidate.review_status !== 'needs_review') {
    throw new PoiAcquisitionError('CANDIDATE_NOT_REVIEWABLE', 409)
  }

  return prisma.$transaction(async tx => {
    const updated = await tx.poiAcquisitionCandidate.update({
      where: { id: candidate.id },
      data: {
        review_status: 'rejected',
        reviewed_by: adminId,
        reviewed_at: new Date(),
        admin_note: adminNote,
      },
    })

    await tx.poiAcquisitionAuditLog.create({
      data: {
        admin_id: adminId,
        action: 'candidate_rejected',
        target_type: 'candidate',
        target_id: candidate.id,
        run_id: candidate.run_id,
        candidate_id: candidate.id,
        before: candidateAudit(candidate),
        after: candidateAudit(updated),
      },
    })

    return updated
  })
}

async function uniqueSlug(tx: Prisma.TransactionClient, cityId: string, baseSlug: string): Promise<string> {
  let suffix = 0
  let slug = baseSlug || 'poi'

  while (await tx.pointOfInterest.findFirst({ where: { city_id: cityId, slug }, select: { id: true } })) {
    suffix += 1
    slug = `${baseSlug || 'poi'}-${suffix}`
  }

  return slug
}

function candidateAudit(candidate: {
  id: string
  review_status: string
  published_poi_id: string | null
  admin_note: string | null
}): Prisma.InputJsonObject {
  return {
    id: candidate.id,
    review_status: candidate.review_status,
    published_poi_id: candidate.published_poi_id,
    admin_note: candidate.admin_note,
  }
}
