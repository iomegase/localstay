import { randomUUID } from 'node:crypto'
import { prisma } from '@/shared/lib/prisma'
import { uploadGuideImage } from '@/shared/lib/image-upload-service'
import { reassignFallbackImages } from '../services/reassign'
import { FallbackImageError } from '../lib/errors'

const STORAGE_MARKER = '/storage/v1/object/public/guide-photos/'

export type FallbackImageDto = {
  id: string
  url: string
  category: { id: string; name: string } | null
  subcategory: { id: string; name: string } | null
  usage_count: number
}

export type FallbackImageListFilter = {
  filter?: 'unclassified'
  category_id?: string
  subcategory_id?: string
}

/** Spec 070 AC-01-03 : images actives, filtrables, avec le nombre de lieux qui les utilisent. */
export async function listFallbackImages(filter: FallbackImageListFilter = {}): Promise<FallbackImageDto[]> {
  const where = filter.filter === 'unclassified'
    ? { deleted_at: null, category_id: null }
    : {
      deleted_at: null,
      ...(filter.category_id ? { category_id: filter.category_id } : {}),
      ...(filter.subcategory_id ? { subcategory_id: filter.subcategory_id } : {}),
    }
  const rows = await prisma.fallbackImage.findMany({
    where,
    orderBy: [{ created_at: 'desc' }, { id: 'asc' }],
    select: {
      id: true,
      url: true,
      category: { select: { id: true, name: true } },
      subcategory: { select: { id: true, name: true } },
      _count: { select: { pois: { where: { deleted_at: null, is_active: true } } } },
    },
  })
  return rows.map(({ _count, ...image }) => ({ ...image, usage_count: _count.pois }))
}

/** Spec 070 AC-01-01 : envoi en masse, WebP, « Non classées ». */
export async function createFallbackImages(files: File[]): Promise<{
  created: Array<{ id: string; url: string }>
  rejected: Array<{ name: string; code: string }>
}> {
  const created: Array<{ id: string; url: string }> = []
  const rejected: Array<{ name: string; code: string }> = []

  for (const file of files) {
    // Un dossier par image : le service nomme les fichiers à la milliseconde.
    const result = await uploadGuideImage(file, `fallbacks/${randomUUID()}`)
    if (!result.ok) {
      rejected.push({ name: file.name, code: result.code })
      continue
    }
    const markerIndex = result.url.indexOf(STORAGE_MARKER)
    const storage_path = markerIndex === -1 ? result.url : result.url.slice(markerIndex + STORAGE_MARKER.length)
    const image = await prisma.fallbackImage.create({
      data: { url: result.url, storage_path },
      select: { id: true, url: true },
    })
    created.push(image)
  }

  if (created.length > 0) await reassignFallbackImages()
  return { created, rejected }
}

/** Spec 070 AC-01-02 / BR-02 : classement groupé ; catégorie nulle = « Non classées ». */
export async function classifyFallbackImages(input: {
  image_ids: string[]
  category_id: string | null
  subcategory_id?: string | null
}): Promise<{ updated: number }> {
  const subcategoryId = input.category_id ? input.subcategory_id ?? null : null

  if (input.category_id) {
    const category = await prisma.category.findFirst({ where: { id: input.category_id, deleted_at: null }, select: { id: true } })
    if (!category) throw new FallbackImageError('CATEGORY_NOT_FOUND', 404)
  }
  if (subcategoryId) {
    const subcategory = await prisma.subCategory.findFirst({
      where: { id: subcategoryId, deleted_at: null },
      select: { id: true, category_id: true },
    })
    if (!subcategory || subcategory.category_id !== input.category_id) {
      throw new FallbackImageError('SUBCATEGORY_CATEGORY_MISMATCH', 400)
    }
  }

  const { count } = await prisma.fallbackImage.updateMany({
    where: { id: { in: input.image_ids }, deleted_at: null },
    data: { category_id: input.category_id, subcategory_id: subcategoryId },
  })
  await reassignFallbackImages()
  return { updated: count }
}

/** Spec 070 AC-01-04 / BR-06 : retrait = soft delete, le fichier reste dans le stockage. */
export async function removeFallbackImage(id: string): Promise<void> {
  const image = await prisma.fallbackImage.findFirst({ where: { id, deleted_at: null }, select: { id: true } })
  if (!image) throw new FallbackImageError('NOT_FOUND', 404)
  await prisma.fallbackImage.update({ where: { id }, data: { deleted_at: new Date() } })
  await reassignFallbackImages()
}
