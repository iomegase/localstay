import { prisma } from '@/shared/lib/prisma'

export interface LodgingQrCodeResult {
  id: string
  lodging_id: string
  city_id: string
  url: string
  storage_url: string
  created_at: Date
}

export async function getActiveLodgingQrCode(lodgingId: string): Promise<LodgingQrCodeResult | null> {
  const row = await prisma.qrCode.findFirst({
    where: { lodging_id: lodgingId, is_active: true },
    select: { id: true, lodging_id: true, city_id: true, url: true, storage_url: true, created_at: true },
  })
  if (!row || !row.lodging_id) return null
  return row as LodgingQrCodeResult
}

export async function deleteExistingLodgingQrCodes(lodgingId: string): Promise<void> {
  await prisma.qrCode.deleteMany({
    where: { lodging_id: lodgingId },
  })
}

export async function createLodgingQrCode(
  lodgingId: string,
  cityId: string,
  url: string,
  storageUrl: string,
): Promise<LodgingQrCodeResult> {
  const row = await prisma.qrCode.create({
    data: { lodging_id: lodgingId, city_id: cityId, url, storage_url: storageUrl, is_active: true },
    select: { id: true, lodging_id: true, city_id: true, url: true, storage_url: true, created_at: true },
  })
  return row as LodgingQrCodeResult
}
