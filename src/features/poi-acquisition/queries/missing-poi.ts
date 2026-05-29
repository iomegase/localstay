import { prisma } from '@/shared/lib/prisma'
import { findGooglePlaceMatch } from '../lib/google-places'
import { mergeHoursIntoReviewPayload } from '../lib/google-hours'
import { geocodeForAcquisition } from '../lib/geocode'
import { PoiAcquisitionError } from '../lib/errors'
import type { MissingPoiCreateSchema } from '../lib/api'
import type { z } from 'zod'

type MissingPoiInput = z.infer<typeof MissingPoiCreateSchema>

export async function getMissingPoiFormOptions() {
  const [cities, categories] = await Promise.all([
    prisma.city.findMany({
      where: { is_active: true, deleted_at: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      where: { is_active: true, deleted_at: null },
      orderBy: { sort_order: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  return { cities, categories }
}

export async function createMissingPoiRequest(merchantId: string, input: MissingPoiInput) {
  const [merchant, city, category] = await Promise.all([
    prisma.user.findFirst({
      where: { id: merchantId, role: 'merchant', is_active: true, deleted_at: null },
      select: { id: true },
    }),
    prisma.city.findFirst({
      where: { id: input.city_id, is_active: true, deleted_at: null },
      select: { id: true, latitude: true, longitude: true },
    }),
    input.category_id
      ? prisma.category.findFirst({
          where: { id: input.category_id, is_active: true, deleted_at: null },
          select: { id: true },
        })
      : Promise.resolve(null),
  ])

  if (!merchant) throw new PoiAcquisitionError('UNAUTHORIZED', 401)
  if (!city) throw new PoiAcquisitionError('INVALID_CITY', 400)
  if (input.category_id && !category) throw new PoiAcquisitionError('INVALID_CATEGORY', 400)

  const [googleMatch, geocode] = await Promise.all([
    findGooglePlaceMatch({ name: input.name, address: input.address }),
    geocodeForAcquisition(input.address, {
      latitude: city.latitude,
      longitude: city.longitude,
    }),
  ])

  return prisma.missingPoiRequest.create({
    data: {
      merchant_id: merchant.id,
      name: input.name,
      address: input.address,
      phone: input.phone ?? null,
      website: input.website ?? null,
      city_id: city.id,
      category_id: category?.id ?? null,
      google_place_id: googleMatch?.google_place_id ?? null,
      google_review_payload: mergeHoursIntoReviewPayload(googleMatch?.review_payload ?? null, googleMatch?.hours ?? null),
      google_review_expires_at: googleMatch?.google_review_expires_at ?? null,
      latitude: geocode.status === 'success' || geocode.status === 'pending_review' ? geocode.latitude : null,
      longitude: geocode.status === 'success' || geocode.status === 'pending_review' ? geocode.longitude : null,
      geocode_status: geocode.status,
      status: 'pending',
    },
  })
}
