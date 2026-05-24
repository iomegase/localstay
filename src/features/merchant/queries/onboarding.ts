import { prisma } from '@/shared/lib/prisma'
import type { MerchantClaim, MerchantProfile } from '@prisma/client'
import type {
  ClaimablePoiDto,
  MerchantClaimDto,
  MerchantOnboardingStatusDto,
  MerchantProfileDto,
} from '../types'

type ClaimablePoiRow = {
  id: string
  name: string
  address: string
  city: { name: string }
  category: { name: string }
  subcategory: { name: string } | null
}

export function toClaimDto(claim: MerchantClaim): MerchantClaimDto {
  return {
    id: claim.id,
    merchant_id: claim.merchant_id,
    poi_id: claim.poi_id,
    status: claim.status as MerchantClaimDto['status'],
    created_at: claim.created_at,
    reviewed_at: claim.reviewed_at,
    admin_note: claim.admin_note,
  }
}

export function toProfileDto(profile: MerchantProfile): MerchantProfileDto {
  return {
    id: profile.id,
    merchant_id: profile.merchant_id,
    poi_id: profile.poi_id,
    status: profile.status as MerchantProfileDto['status'],
    approved_claim_id: profile.approved_claim_id,
  }
}

function toClaimablePoiDto(poi: ClaimablePoiRow): ClaimablePoiDto {
  return {
    id: poi.id,
    name: poi.name,
    address: poi.address,
    city_name: poi.city.name,
    category_name: poi.category.name,
    subcategory_name: poi.subcategory?.name ?? null,
  }
}

const SEARCH_STOP_WORDS = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'un', 'une', 'au', 'aux'])

function buildSearchTerms(query: string): string[] {
  const normalized = query
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map(term => term.trim())
    .filter(term => term.length >= 3 && !SEARCH_STOP_WORDS.has(term))

  return Array.from(new Set([query, ...normalized]))
}

export async function searchClaimablePois(query: string): Promise<ClaimablePoiDto[]> {
  const terms = buildSearchTerms(query)
  const pois = await prisma.pointOfInterest.findMany({
    where: {
      is_active: true,
      deleted_at: null,
      NOT: { geocode_status: 'rejected' },
      merchant_profile: { is: null },
      OR: terms.flatMap(term => [
        { name: { contains: term, mode: 'insensitive' as const } },
        { address: { contains: term, mode: 'insensitive' as const } },
      ]),
    },
    select: {
      id: true,
      name: true,
      address: true,
      city: { select: { name: true } },
      category: { select: { name: true } },
      subcategory: { select: { name: true } },
    },
    orderBy: { name: 'asc' },
    take: 20,
  })

  return pois.map(poi => toClaimablePoiDto(poi))
}

export async function createMerchantClaim(merchantId: string, poiId: string): Promise<MerchantClaimDto> {
  const activeProfile = await prisma.merchantProfile.findFirst({
    where: { merchant_id: merchantId, status: 'active', deleted_at: null },
  })
  if (activeProfile) throw new Error('MERCHANT_ALREADY_LINKED')

  const pendingClaim = await prisma.merchantClaim.findFirst({
    where: { merchant_id: merchantId, status: 'pending', deleted_at: null },
  })
  if (pendingClaim) throw new Error('CLAIM_ALREADY_PENDING')

  const claimedPoi = await prisma.merchantProfile.findFirst({
    where: { poi_id: poiId, status: 'active', deleted_at: null },
  })
  if (claimedPoi) throw new Error('POI_ALREADY_CLAIMED')

  const poi = await prisma.pointOfInterest.findFirst({
    where: {
      id: poiId,
      is_active: true,
      deleted_at: null,
      NOT: { geocode_status: 'rejected' },
      merchant_profile: { is: null },
    },
  })
  if (!poi) throw new Error('POI_NOT_CLAIMABLE')

  const claim = await prisma.merchantClaim.create({
    data: { merchant_id: merchantId, poi_id: poiId, status: 'pending' },
  })

  return toClaimDto(claim)
}

export async function getMerchantOnboardingStatus(merchantId: string): Promise<MerchantOnboardingStatusDto> {
  const profile = await prisma.merchantProfile.findFirst({
    where: { merchant_id: merchantId, status: 'active', deleted_at: null },
  })
  if (profile) {
    return { state: 'approved', claim: null, profile: toProfileDto(profile) }
  }

  const claim = await prisma.merchantClaim.findFirst({
    where: { merchant_id: merchantId, deleted_at: null },
    orderBy: { created_at: 'desc' },
  })

  if (!claim) return { state: 'needs_claim', claim: null, profile: null }
  if (claim.status === 'pending') return { state: 'pending_review', claim: toClaimDto(claim), profile: null }
  return { state: 'rejected', claim: toClaimDto(claim), profile: null }
}
