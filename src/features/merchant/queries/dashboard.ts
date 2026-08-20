import { prisma } from '@/shared/lib/prisma'
import { Prisma } from '@prisma/client'
import type {
  MerchantDashboardProfileDto,
  MerchantOfferDto,
  MerchantStatsDto,
} from '../types'
import type { MerchantOfferCreateInput, MerchantProfilePatchInput } from '../schemas'
import { runPoiMutationWithDiscoveryReconciliation } from '@/features/public-discovery/queries/mutation-reconciliation'
import { safelyRevalidateDiscoveryPaths } from '@/features/public-discovery/lib/revalidation'

const merchantProfileSelect = {
  id: true,
  merchant_id: true,
  poi_id: true,
  status: true,
  approved_claim_id: true,
  poi: {
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      hours: true,
      phone: true,
      website: true,
      photos: true,
      city: { select: { slug: true } },
      category: { select: { slug: true } },
    },
  },
} satisfies Prisma.MerchantProfileSelect

const poiSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  hours: true,
  phone: true,
  website: true,
  photos: true,
  city: { select: { slug: true } },
  category: { select: { slug: true } },
} satisfies Prisma.PointOfInterestSelect

type MerchantProfileRow = Prisma.MerchantProfileGetPayload<{ select: typeof merchantProfileSelect }>
type MerchantPoiRow = MerchantProfileRow['poi']

export class MerchantDashboardError extends Error {
  constructor(public readonly code: string, message = code) {
    super(message)
  }
}

function asRecord(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function publicUrlForPoi(poi: Pick<MerchantPoiRow, 'slug' | 'city' | 'category'>): string {
  return `/guide/${poi.city.slug}/${poi.category.slug}/${poi.slug}`
}

function toProfileDto(profile: MerchantProfileRow): MerchantDashboardProfileDto {
  return {
    id: profile.id,
    poi: {
      id: profile.poi.id,
      name: profile.poi.name,
      description: profile.poi.description,
      hours: asRecord(profile.poi.hours),
      phone: profile.poi.phone,
      website: profile.poi.website,
      photos: profile.poi.photos,
      public_url: publicUrlForPoi(profile.poi),
    },
  }
}

async function getActiveProfile(merchantId: string): Promise<MerchantProfileRow> {
  const profile = await prisma.merchantProfile.findFirst({
    where: { merchant_id: merchantId, status: 'active', deleted_at: null },
    select: merchantProfileSelect,
  })

  if (!profile) {
    throw new MerchantDashboardError('MERCHANT_PROFILE_NOT_ACTIVE')
  }

  return profile
}

export async function getMerchantDashboardProfile(merchantId: string): Promise<MerchantDashboardProfileDto> {
  return toProfileDto(await getActiveProfile(merchantId))
}

export async function updateMerchantDashboardProfile(
  merchantId: string,
  input: MerchantProfilePatchInput,
): Promise<MerchantDashboardProfileDto> {
  const profile = await getActiveProfile(merchantId)
  const data: Prisma.PointOfInterestUpdateInput = {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    ...(input.website !== undefined ? { website: input.website } : {}),
    ...(input.hours !== undefined ? { hours: input.hours === null ? Prisma.DbNull : input.hours as Prisma.InputJsonObject } : {}),
  }
  const mutation = await runPoiMutationWithDiscoveryReconciliation({
    poiId: profile.poi_id,
    auditActorId: merchantId,
    cause: { source: 'merchant_dashboard', reason: 'poi_profile_updated' },
    mutate: tx => tx.pointOfInterest.update({
      where: { id: profile.poi_id },
      data,
      select: poiSelect,
    }),
  })
  if (mutation.discoveryRevalidationPaths.length > 0) {
    safelyRevalidateDiscoveryPaths(mutation.discoveryRevalidationPaths)
  }

  return toProfileDto({ ...profile, poi: mutation.result })
}

export async function appendMerchantPoiPhoto(
  merchantId: string,
  photoUrl: string,
): Promise<{ url: string; photos: string[] }> {
  const profile = await getActiveProfile(merchantId)
  const poi = await prisma.pointOfInterest.findFirst({
    where: { id: profile.poi_id, deleted_at: null, is_active: true },
    select: poiSelect,
  })

  if (!poi) {
    throw new MerchantDashboardError('POI_NOT_FOUND')
  }

  if (poi.photos.length >= 5) {
    throw new MerchantDashboardError('PHOTO_LIMIT_REACHED')
  }

  const photos = [...poi.photos, photoUrl]
  await prisma.pointOfInterest.update({
    where: { id: profile.poi_id },
    data: { photos },
    select: poiSelect,
  })

  return { url: photoUrl, photos }
}

export async function assertMerchantCanAppendPhoto(merchantId: string): Promise<void> {
  const profile = await getActiveProfile(merchantId)
  const poi = await prisma.pointOfInterest.findFirst({
    where: { id: profile.poi_id, deleted_at: null, is_active: true },
    select: { id: true, photos: true },
  })

  if (!poi) {
    throw new MerchantDashboardError('POI_NOT_FOUND')
  }

  if (poi.photos.length >= 5) {
    throw new MerchantDashboardError('PHOTO_LIMIT_REACHED')
  }
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

export async function getMerchantStats(merchantId: string): Promise<MerchantStatsDto> {
  const profile = await getActiveProfile(merchantId)
  const today = startOfUtcDay(new Date())
  const startDate = new Date(today)
  startDate.setUTCDate(today.getUTCDate() - 29)

  const events = await prisma.analytics.findMany({
    where: {
      poi_id: profile.poi_id,
      event_type: { in: ['poi_click', 'phone_click', 'directions_click', 'website_click'] },
      created_at: { gte: startDate },
    },
    select: { created_at: true, event_type: true, poi_id: true },
  })

  const series = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(startDate)
    date.setUTCDate(startDate.getUTCDate() + index)
    return { date: dateKey(date), count: 0 }
  })

  const seriesByDate = new Map(series.map(point => [point.date, point]))
  const totals = {
    profile_views: 0,
    phone_clicks: 0,
    directions_clicks: 0,
    website_clicks: 0,
  }

  for (const event of events) {
    if (event.event_type === 'poi_click') {
      totals.profile_views += 1
      const point = seriesByDate.get(dateKey(event.created_at))
      if (point) point.count += 1
    } else if (event.event_type === 'phone_click') {
      totals.phone_clicks += 1
    } else if (event.event_type === 'directions_click') {
      totals.directions_clicks += 1
    } else if (event.event_type === 'website_click') {
      totals.website_clicks += 1
    }
  }

  return { period_days: 30, totals, views_series: series }
}

type OfferRow = {
  id: string
  title: string
  description: string
  ends_at: Date
  is_active: boolean
}

function toOfferDto(offer: OfferRow): MerchantOfferDto {
  return {
    id: offer.id,
    title: offer.title,
    description: offer.description,
    ends_at: offer.ends_at.toISOString(),
    status: offer.is_active && offer.ends_at.getTime() > Date.now() ? 'active' : 'expired',
  }
}

export async function listMerchantOffers(merchantId: string): Promise<MerchantOfferDto[]> {
  const profile = await getActiveProfile(merchantId)
  const offers = await prisma.merchantOffer.findMany({
    where: { poi_id: profile.poi_id, deleted_at: null },
    select: { id: true, title: true, description: true, ends_at: true, is_active: true },
    orderBy: { created_at: 'desc' },
  })

  return offers.map(toOfferDto)
}

export async function createMerchantOffer(
  merchantId: string,
  input: MerchantOfferCreateInput,
): Promise<MerchantOfferDto> {
  const profile = await getActiveProfile(merchantId)
  const activeOfferCount = await prisma.merchantOffer.count({
    where: {
      poi_id: profile.poi_id,
      deleted_at: null,
      is_active: true,
      ends_at: { gt: new Date() },
    },
  })

  if (activeOfferCount >= 3) {
    throw new MerchantDashboardError('OFFER_LIMIT_REACHED')
  }

  const offer = await prisma.merchantOffer.create({
    data: {
      poi_id: profile.poi_id,
      title: input.title,
      description: input.description,
      ends_at: new Date(input.ends_at),
    },
  })

  return toOfferDto(offer)
}

export async function softDeleteMerchantOffer(merchantId: string, offerId: string): Promise<void> {
  const profile = await getActiveProfile(merchantId)
  const offer = await prisma.merchantOffer.findFirst({
    where: { id: offerId, deleted_at: null },
    select: { id: true, poi_id: true, deleted_at: true },
  })

  if (!offer) {
    throw new MerchantDashboardError('OFFER_NOT_FOUND')
  }

  if (offer.poi_id !== profile.poi_id) {
    throw new MerchantDashboardError('FORBIDDEN')
  }

  await prisma.merchantOffer.update({
    where: { id: offerId },
    data: { deleted_at: new Date(), is_active: false },
  })
}
