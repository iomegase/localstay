import { prisma } from '@/shared/lib/prisma'
import type { MerchantClaimDto, MerchantProfileDto } from '../types'
import { toClaimDto, toProfileDto } from './onboarding'

export async function listPendingMerchantClaims(): Promise<MerchantClaimDto[]> {
  const claims = await prisma.merchantClaim.findMany({
    where: { status: 'pending', deleted_at: null },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      merchant_id: true,
      poi_id: true,
      status: true,
      created_at: true,
      reviewed_at: true,
      admin_note: true,
      merchant: { select: { email: true } },
      poi: { select: { name: true, city: { select: { name: true } } } },
    },
  })
  return claims.map(claim => ({
    id: claim.id,
    merchant_id: claim.merchant_id,
    poi_id: claim.poi_id,
    status: claim.status as MerchantClaimDto['status'],
    created_at: claim.created_at,
    reviewed_at: claim.reviewed_at,
    admin_note: claim.admin_note,
    merchant_email: claim.merchant?.email,
    poi_name: claim.poi?.name,
    city_name: claim.poi?.city?.name,
  }))
}

async function getReviewableClaim(id: string) {
  const claim = await prisma.merchantClaim.findUnique({ where: { id } })
  if (!claim || claim.deleted_at) throw new Error('NOT_FOUND')
  if (claim.status !== 'pending') throw new Error('CLAIM_ALREADY_REVIEWED')
  return claim
}

export async function approveMerchantClaim(id: string, adminId: string): Promise<MerchantProfileDto> {
  const claim = await getReviewableClaim(id)

  const profile = await prisma.$transaction(async tx => {
    await tx.merchantClaim.update({
      where: { id },
      data: { status: 'approved', reviewed_by: adminId, reviewed_at: new Date() },
    })

    return tx.merchantProfile.create({
      data: {
        merchant_id: claim.merchant_id,
        poi_id: claim.poi_id,
        status: 'active',
        approved_claim_id: claim.id,
      },
    })
  })

  return toProfileDto(profile)
}

export async function rejectMerchantClaim(id: string, adminId: string, adminNote: string): Promise<MerchantClaimDto> {
  await getReviewableClaim(id)

  const claim = await prisma.merchantClaim.update({
    where: { id },
    data: {
      status: 'rejected',
      admin_note: adminNote,
      reviewed_by: adminId,
      reviewed_at: new Date(),
    },
  })

  return toClaimDto(claim)
}
