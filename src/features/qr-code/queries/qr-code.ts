import { prisma } from '@/shared/lib/prisma'
import type { QrCodeResult } from '../types'

function toResult(
  row: { id: string; city_id: string; url: string; storage_url: string; created_at: Date },
  citySlug: string,
): QrCodeResult {
  return {
    id: row.id,
    city_slug: citySlug,
    url: row.url,
    storage_url: row.storage_url,
    created_at: row.created_at.toISOString(),
  }
}

export async function getQrCode(citySlug: string): Promise<QrCodeResult | null> {
  const city = await prisma.city.findFirst({
    where: { slug: citySlug, is_active: true, deleted_at: null },
    select: { id: true, slug: true },
  })
  if (!city) return null

  const row = await prisma.qrCode.findFirst({
    where: { city_id: city.id, lodging_id: null, is_active: true },
    select: { id: true, city_id: true, url: true, storage_url: true, created_at: true },
  })
  if (!row) return null

  return toResult(row, city.slug)
}

export async function replaceCityQrCode(
  cityId: string,
  citySlug: string,
  url: string,
  storageUrl: string,
): Promise<QrCodeResult> {
  // Exception ADR-004 : les QR codes sont remplacés physiquement, sans reliquats.
  await prisma.qrCode.deleteMany({
    where: { city_id: cityId, lodging_id: null },
  })

  const row = await prisma.qrCode.create({
    data: { city_id: cityId, url, storage_url: storageUrl, is_active: true },
    select: { id: true, city_id: true, url: true, storage_url: true, created_at: true },
  })

  return toResult(row, citySlug)
}
