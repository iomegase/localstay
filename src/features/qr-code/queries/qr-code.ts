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
    where: { city_id: city.id, is_active: true, deleted_at: null },
    select: { id: true, city_id: true, url: true, storage_url: true, created_at: true },
  })
  if (!row) return null

  return toResult(row, city.slug)
}

export async function upsertQrCode(
  cityId: string,
  citySlug: string,
  url: string,
  storageUrl: string,
): Promise<QrCodeResult> {
  // city_id is no longer @unique (a city may have multiple QR codes, one per lodging).
  // For the city-level (lodging_id = null) QR code we find the existing record first.
  const existing = await prisma.qrCode.findFirst({
    where: { city_id: cityId, lodging_id: null },
    select: { id: true },
  })

  const row = existing
    ? await prisma.qrCode.update({
        where: { id: existing.id },
        data: { url, storage_url: storageUrl, is_active: true, deleted_at: null },
        select: { id: true, city_id: true, url: true, storage_url: true, created_at: true },
      })
    : await prisma.qrCode.create({
        data: { city_id: cityId, url, storage_url: storageUrl, is_active: true },
        select: { id: true, city_id: true, url: true, storage_url: true, created_at: true },
      })

  return toResult(row, citySlug)
}
