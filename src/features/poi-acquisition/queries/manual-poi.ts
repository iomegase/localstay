import { Prisma } from '@prisma/client'
import { prisma } from '@/shared/lib/prisma'
import { geocodeForAcquisition } from '../lib/geocode'
import { findProbableDuplicates } from '../lib/duplicate-detection'
import { PoiAcquisitionError } from '../lib/errors'
import { createPoiSlug } from '../lib/slug'
import {
  fetchOfficialWebsitePhotoEnrichment,
  mergeOfficialWebsitePhotos,
} from '../services/official-website-photos'
import type { ManualPoiCreateSchema } from '../lib/api'
import type { z } from 'zod'

type ManualPoiInput = z.infer<typeof ManualPoiCreateSchema>

export async function getManualPoiFormOptions() {
  const [cities, categories] = await Promise.all([
    prisma.city.findMany({
      where: { is_active: true, deleted_at: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      where: { is_active: true, deleted_at: null },
      orderBy: { sort_order: 'asc' },
      select: {
        id: true,
        name: true,
        subcategories: {
          where: { is_active: true, deleted_at: null },
          orderBy: { sort_order: 'asc' },
          select: { id: true, name: true },
        },
      },
    }),
  ])

  return { cities, categories }
}

export async function createManualPoi(input: ManualPoiInput, adminId: string) {
  const [city, category, subcategory] = await Promise.all([
    prisma.city.findFirst({
      where: { id: input.city_id, is_active: true, deleted_at: null },
      select: { id: true, latitude: true, longitude: true },
    }),
    prisma.category.findFirst({
      where: { id: input.category_id, is_active: true, deleted_at: null },
      select: { id: true },
    }),
    input.subcategory_id
      ? prisma.subCategory.findFirst({
          where: {
            id: input.subcategory_id,
            category_id: input.category_id,
            is_active: true,
            deleted_at: null,
          },
          select: { id: true },
        })
      : Promise.resolve(null),
  ])

  if (!city) throw new PoiAcquisitionError('INVALID_CITY', 400)
  if (!category) throw new PoiAcquisitionError('INVALID_CATEGORY', 400)
  if (input.subcategory_id && !subcategory) throw new PoiAcquisitionError('INVALID_SUBCATEGORY', 400)

  const geocode = await geocodeForAcquisition(input.address, {
    latitude: city.latitude,
    longitude: city.longitude,
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

  const existingPois = await prisma.pointOfInterest.findMany({
    where: {
      city_id: city.id,
      is_active: true,
      deleted_at: null,
      name: { contains: input.name, mode: 'insensitive' },
    },
    select: {
      id: true,
      name: true,
      address: true,
      latitude: true,
      longitude: true,
      google_place_id: true,
    },
    take: 25,
  })
  const duplicates = findProbableDuplicates(
    {
      name: input.name,
      address: input.address,
      latitude: geocode.latitude,
      longitude: geocode.longitude,
      google_place_id: null,
    },
    existingPois,
  )
  if (duplicates.length > 0 && !input.confirm_duplicate) {
    throw new PoiAcquisitionError('DUPLICATE_POI_CANDIDATE', 409, {
      duplicates: duplicates.map(duplicate => duplicate.id),
    })
  }

  const officialPhotos = await fetchOfficialWebsitePhotoEnrichment(input.website ?? null)

  return prisma.$transaction(async tx => {
    const poi = await tx.pointOfInterest.create({
      data: {
        name: input.name,
        slug: await uniqueSlug(tx, city.id, createPoiSlug(input.name)),
        description: input.description ?? null,
        address: input.address,
        latitude: geocode.latitude,
        longitude: geocode.longitude,
        phone: input.phone ?? null,
        website: input.website ?? null,
        photos: mergeOfficialWebsitePhotos([], officialPhotos?.photos ?? []),
        tags: [],
        geocode_status: geocode.status,
        geocoded_at: new Date(),
        geocode_provider: 'mapbox',
        review_source: 'MANUAL',
        is_active: true,
        city_id: city.id,
        category_id: category.id,
        subcategory_id: subcategory?.id ?? null,
      },
    })

    await tx.poiAcquisitionAuditLog.create({
      data: {
        admin_id: adminId,
        action: 'manual_poi_created',
        target_type: 'poi',
        target_id: poi.id,
        after: {
          id: poi.id,
          name: poi.name,
          city_id: poi.city_id,
          category_id: poi.category_id,
          geocode_status: poi.geocode_status,
        },
      },
    })

    return poi
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
