import { prisma } from '@/shared/lib/prisma'

export async function recordQrScanIfPresent(lodgingId: string | null): Promise<void> {
  if (!lodgingId) return

  const lodging = await prisma.lodging.findFirst({
    where: { id: lodgingId, deleted_at: null },
    select: { id: true, city_id: true },
  })
  if (!lodging) return

  await prisma.analytics.create({
    data: {
      lodging_id: lodging.id,
      city_id: lodging.city_id,
      event_type: 'qr_scan',
    },
  })
}
