import type { Prisma } from '@prisma/client'

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
  await tx.contactMessage.deleteMany({ where: { lodging_id: lodgingId } })

  await tx.lodging.delete({ where: { id: lodgingId } })
}
