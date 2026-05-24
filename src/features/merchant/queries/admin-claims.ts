import { prisma } from '@/shared/lib/prisma'
import type { MerchantClaimDto, MerchantProfileDto } from '../types'
import { toClaimDto, toProfileDto } from './onboarding'

export async function listPendingMerchantClaims(): Promise<MerchantClaimDto[]> {
  const claims = await prisma.merchantClaim.findMany({
    where: { status: 'pending', deleted_at: null },
    orderBy: { created_at: 'asc' },
  })
  return claims.map(claim => toClaimDto(claim))
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
