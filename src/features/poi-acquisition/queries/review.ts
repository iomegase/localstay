import { Prisma } from '@prisma/client'
import { prisma } from '@/shared/lib/prisma'
import { PoiAcquisitionError } from '../lib/errors'
import { createPoiSlug } from '../lib/slug'
import { geocodeForAcquisition } from '../lib/geocode'
import {
  extractHoursFromReviewPayload,
  extractRatingFromReviewPayload,
  extractRatingCountFromReviewPayload,
} from '../lib/google-hours'
import {
  fetchOfficialWebsitePhotoEnrichment,
  mergeOfficialWebsitePhotos,
} from '../services/official-website-photos'

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
  const officialPhotos = await fetchOfficialWebsitePhotoEnrichment(candidate.website)
  const hours = extractHoursFromReviewPayload(candidate.google_review_payload)
  const googleRating = extractRatingFromReviewPayload(candidate.google_review_payload)
  const googleRatingCount = extractRatingCountFromReviewPayload(candidate.google_review_payload)

  return prisma.$transaction(async tx => {
    const poi = await tx.pointOfInterest.create({
      data: {
        name: candidate.name,
        slug: await uniqueSlug(tx, candidate.run.city_id, createPoiSlug(candidate.name)),
        description: candidate.description,
        // Spec 094 AC-02 : sources de la description copiées sur le POI.
        description_sources: candidate.description_sources ?? Prisma.JsonNull,
        address: candidate.address,
        latitude,
        longitude,
        phone: candidate.phone,
        website: candidate.website,
        photos: mergeOfficialWebsitePhotos([], officialPhotos?.photos ?? []),
        tags: [],
        hours: hours ?? Prisma.JsonNull,
        ...(googleRating !== null ? { rating: googleRating } : {}),
        ...(googleRatingCount !== null ? { rating_count: googleRatingCount } : {}),
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
        actor_type: 'ADMIN',
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
        actor_type: 'ADMIN',
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
  return closeCandidate(candidateId, adminId, 'rejected', adminNote)
}

/** Spec 071 US-03 : exclure le lieu de toutes les acquisitions de la ville. */
export async function excludeCandidate(candidateId: string, adminId: string) {
  return closeCandidate(candidateId, adminId, 'excluded')
}

/**
 * Spec 071 AC-02-01 / AC-03-01 : clôt la revue du candidat et mémorise la décision
 * (rejet : ville + catégorie du run ; exclusion : ville, toutes catégories).
 */
async function closeCandidate(
  candidateId: string,
  adminId: string,
  kind: 'rejected' | 'excluded',
  adminNote?: string,
) {
  const candidate = await prisma.poiAcquisitionCandidate.findFirst({
    where: { id: candidateId, deleted_at: null },
    include: { run: { select: { city_id: true, category_id: true } } },
  })
  if (!candidate || candidate.review_status !== 'needs_review') {
    throw new PoiAcquisitionError('CANDIDATE_NOT_REVIEWABLE', 409)
  }

  return prisma.$transaction(async tx => {
    const updated = await tx.poiAcquisitionCandidate.update({
      where: { id: candidate.id },
      data: {
        review_status: kind,
        reviewed_by: adminId,
        reviewed_at: new Date(),
        admin_note: adminNote,
      },
    })

    // BR-01 : la mémoire porte sur le lieu Google ; sans identifiant, rien à mémoriser.
    if (candidate.google_place_id) {
      const category_id = kind === 'rejected' ? candidate.run.category_id : null
      const existing = await tx.poiAcquisitionMemory.findFirst({
        where: {
          city_id: candidate.run.city_id,
          google_place_id: candidate.google_place_id,
          kind,
          category_id,
          deleted_at: null,
        },
        select: { id: true },
      })
      if (!existing) {
        await tx.poiAcquisitionMemory.create({
          data: {
            city_id: candidate.run.city_id,
            google_place_id: candidate.google_place_id,
            kind,
            category_id,
            name: candidate.name,
            address: candidate.address,
            created_by: adminId,
          },
        })
      }
    }

    await tx.poiAcquisitionAuditLog.create({
      data: {
        admin_id: adminId,
        actor_type: 'ADMIN',
        action: kind === 'rejected' ? 'candidate_rejected' : 'candidate_excluded',
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

export type CandidateUpdateInput = {
  name?: string
  address?: string
  phone?: string | null
  website?: string | null
  description?: string | null
  category_id?: string
  subcategory_id?: string | null
}

/**
 * Spec 071 US-01 : corrige un candidat avant publication (catégorie comprise) ; une
 * nouvelle adresse est regéocodée par Mapbox (018 BR-03).
 */
export async function updateCandidate(candidateId: string, input: CandidateUpdateInput, adminId: string) {
  const candidate = await prisma.poiAcquisitionCandidate.findFirst({
    where: { id: candidateId, deleted_at: null },
    include: { run: { select: { city: { select: { latitude: true, longitude: true } } } } },
  })
  if (!candidate || candidate.review_status !== 'needs_review') {
    throw new PoiAcquisitionError('CANDIDATE_NOT_REVIEWABLE', 409)
  }

  const data: Prisma.PoiAcquisitionCandidateUncheckedUpdateInput = {}
  if (input.name !== undefined) data.name = input.name
  if (input.phone !== undefined) data.phone = input.phone
  if (input.website !== undefined) data.website = input.website
  if (input.description !== undefined) data.description = input.description

  const categoryId = input.category_id ?? candidate.category_id
  if (input.category_id !== undefined) {
    const category = await prisma.category.findFirst({
      where: { id: input.category_id, is_active: true, deleted_at: null },
      select: { id: true },
    })
    if (!category) throw new PoiAcquisitionError('INVALID_CATEGORY', 400)
    data.category_id = input.category_id
    // Changer de catégorie retire l'ancienne sous-catégorie, sauf nouvelle valeur fournie.
    if (input.subcategory_id === undefined && input.category_id !== candidate.category_id) data.subcategory_id = null
  }
  if (input.subcategory_id !== undefined) {
    if (input.subcategory_id !== null) {
      const subcategory = await prisma.subCategory.findFirst({
        where: { id: input.subcategory_id, is_active: true, deleted_at: null },
        select: { id: true, category_id: true },
      })
      if (!subcategory || subcategory.category_id !== categoryId) {
        throw new PoiAcquisitionError('SUBCATEGORY_CATEGORY_MISMATCH', 400)
      }
    }
    data.subcategory_id = input.subcategory_id
  }

  if (input.address !== undefined && input.address !== candidate.address) {
    data.address = input.address
    const geocode = await geocodeForAcquisition(input.address, candidate.run.city)
    const located = geocode.status === 'success' || geocode.status === 'pending_review'
    data.latitude = located ? geocode.latitude : null
    data.longitude = located ? geocode.longitude : null
    data.geocode_status = geocode.status
    data.geocode_provider = located ? 'mapbox' : null
    data.geocode_confidence = located ? geocode.confidence : null
  }

  return prisma.$transaction(async tx => {
    const updated = await tx.poiAcquisitionCandidate.update({ where: { id: candidate.id }, data })
    await tx.poiAcquisitionAuditLog.create({
      data: {
        admin_id: adminId,
        actor_type: 'ADMIN',
        action: 'candidate_updated',
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
