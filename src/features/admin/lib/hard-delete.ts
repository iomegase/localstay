import type { Prisma } from '@prisma/client'
import { prisma } from '@/shared/lib/prisma'
import { createSupabaseServer } from '@/shared/lib/supabase'

export class HardDeleteError extends Error {
  constructor(
    public code: 'NOT_FOUND',
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'HardDeleteError'
  }
}

export async function hardDeleteLodging(
  tx: Prisma.TransactionClient,
  lodgingId: string,
): Promise<void> {
  const profile = await tx.lodgingPublicProfile.findUnique({
    where: { lodging_id: lodgingId },
    select: { id: true },
  })
  if (profile) {
    await tx.lodgingPhoto.deleteMany({ where: { profile_id: profile.id } })
    await tx.lodgingAmenity.deleteMany({ where: { profile_id: profile.id } })
    await tx.lodgingFaqItem.deleteMany({ where: { profile_id: profile.id } })
    await tx.lodgingPublicProfile.deleteMany({ where: { lodging_id: lodgingId } })
  }

  await tx.qrCode.deleteMany({ where: { lodging_id: lodgingId } })
  await tx.analytics.deleteMany({ where: { lodging_id: lodgingId } })
  await tx.analyticsInteractionEvent.deleteMany({ where: { lodging_id: lodgingId } })
  await tx.lodgingCustomization.deleteMany({ where: { lodging_id: lodgingId } })
  await tx.lodgingFeaturedPoi.deleteMany({ where: { lodging_id: lodgingId } })
  await tx.lodgingPracticalBlock.deleteMany({ where: { lodging_id: lodgingId } })
  await tx.lodgingArrivalInstruction.deleteMany({ where: { lodging_id: lodgingId } })
  await tx.contactMessage.deleteMany({ where: { lodging_id: lodgingId } })

  await tx.lodging.delete({ where: { id: lodgingId } })
}

export async function hardDeleteUserAccount(
  userId: string,
): Promise<{ deletedLodgings: number; authDeleted: boolean }> {
  const { deletedLodgings, supabaseId } = await prisma.$transaction(async tx => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, supabase_id: true },
    })
    if (!user) throw new HardDeleteError('NOT_FOUND', 404, 'Compte introuvable')

    const lodgings = await tx.lodging.findMany({
      where: { owner_id: userId },
      select: { id: true },
    })
    for (const lodging of lodgings) {
      await hardDeleteLodging(tx, lodging.id)
    }

    await tx.subscription.deleteMany({ where: { user_id: userId } })
    await tx.missingPoiRequest.deleteMany({ where: { merchant_id: userId } })
    await tx.merchantClaim.deleteMany({ where: { merchant_id: userId } })
    await tx.merchantProfile.deleteMany({ where: { merchant_id: userId } })
    await tx.contactMessage.deleteMany({ where: { owner_id: userId } })
    await tx.user.delete({ where: { id: userId } })

    return { deletedLodgings: lodgings.length, supabaseId: user.supabase_id }
  })

  const supabase = createSupabaseServer()
  const { error } = await supabase.auth.admin.deleteUser(supabaseId)
  if (error) {
    console.error(
      `[hardDeleteUserAccount] Auth deletion failed for ${supabaseId}: ${error.message}`,
    )
  }

  return { deletedLodgings, authDeleted: !error }
}
