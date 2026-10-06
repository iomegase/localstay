import { prisma } from '@/shared/lib/prisma'
import { PoiAcquisitionError } from '../lib/errors'
import type { ReviewMemoryEntry } from '../lib/review-memory'

/** Spec 071 : décisions de revue actives d'une ville (filtrage du pipeline, badges). */
export async function loadCityReviewMemories(cityId: string): Promise<ReviewMemoryEntry[]> {
  const rows = await prisma.poiAcquisitionMemory.findMany({
    where: { city_id: cityId, deleted_at: null },
    select: { google_place_id: true, kind: true, category_id: true, category: { select: { name: true } } },
  })
  return rows.map(row => ({
    google_place_id: row.google_place_id,
    kind: row.kind,
    category_id: row.category_id,
    category_name: row.category?.name ?? null,
  }))
}

export type ReviewMemoryDto = {
  id: string
  kind: string
  name: string
  address: string
  city: { id: string; name: string }
  category: { id: string; name: string } | null
  created_at: string
}

/** Spec 071 AC-03-03 : liste « Lieux exclus ou rejetés ». */
export async function listReviewMemories(cityId?: string): Promise<ReviewMemoryDto[]> {
  const rows = await prisma.poiAcquisitionMemory.findMany({
    where: { deleted_at: null, ...(cityId ? { city_id: cityId } : {}) },
    orderBy: [{ created_at: 'desc' }, { id: 'asc' }],
    select: {
      id: true, kind: true, name: true, address: true, created_at: true,
      city: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  })
  return rows.map(row => ({ ...row, created_at: row.created_at.toISOString() }))
}

/** Spec 071 AC-03-03 / BR-04 : réintégrer = retirer la mémoire (soft delete). */
export async function reinstateReviewMemory(id: string): Promise<void> {
  const memory = await prisma.poiAcquisitionMemory.findFirst({ where: { id, deleted_at: null }, select: { id: true } })
  if (!memory) throw new PoiAcquisitionError('NOT_FOUND', 404)
  await prisma.poiAcquisitionMemory.update({ where: { id }, data: { deleted_at: new Date() } })
}
