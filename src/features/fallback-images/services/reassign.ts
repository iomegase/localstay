import { isUsableAdminPhotoUrl } from '@/features/admin-pois/lib/admin-poi-rules'
import { prisma } from '@/shared/lib/prisma'
import { planFallbackAssignments, type FallbackAssignablePoi } from '../lib/assignment'

const poiSelect = {
  id: true,
  city_id: true,
  category_id: true,
  subcategory_id: true,
  photos: true,
  fallback_image_id: true,
} as const

type PoiRow = {
  id: string
  city_id: string
  category_id: string
  subcategory_id: string | null
  photos: string[]
  fallback_image_id: string | null
}

function toAssignable(row: PoiRow): FallbackAssignablePoi {
  return {
    id: row.id,
    city_id: row.city_id,
    category_id: row.category_id,
    subcategory_id: row.subcategory_id,
    has_photo: row.photos.some(isUsableAdminPhotoUrl),
    fallback_image_id: row.fallback_image_id,
  }
}

/**
 * Spec 070 AC-02-04 : recalcule les images de remplacement des POI actifs (tous, ou
 * ceux de `poiIds`), en comptant l'usage sur l'ensemble de leurs villes. N'écrit que
 * les attributions qui changent.
 */
export async function reassignFallbackImages(
  scope: { poiIds?: string[] } = {},
): Promise<{ examined: number; updated: number }> {
  const active = { deleted_at: null, is_active: true }
  const targets = (await prisma.pointOfInterest.findMany({
    where: scope.poiIds ? { ...active, id: { in: scope.poiIds } } : active,
    select: poiSelect,
  })) as PoiRow[]
  if (targets.length === 0) return { examined: 0, updated: 0 }

  const others = scope.poiIds
    ? ((await prisma.pointOfInterest.findMany({
      where: { ...active, city_id: { in: [...new Set(targets.map(target => target.city_id))] } },
      select: poiSelect,
    })) as PoiRow[])
    : targets
  const images = await prisma.fallbackImage.findMany({
    where: { deleted_at: null, category_id: { not: null } },
    select: { id: true, category_id: true, subcategory_id: true, created_at: true },
  })

  const changes = planFallbackAssignments(targets.map(toAssignable), images, others.map(toAssignable))
  for (const change of changes) {
    await prisma.pointOfInterest.update({
      where: { id: change.poi_id },
      data: { fallback_image_id: change.fallback_image_id },
    })
  }
  return { examined: targets.length, updated: changes.length }
}

/**
 * Spec 070 AC-02-04 : recalcul après écriture d'une fiche, sans jamais faire échouer
 * l'enregistrement (rattrapé au prochain recalcul de la médiathèque).
 */
export async function refreshFallbackImagesSafely(poiIds: Array<string | null | undefined>): Promise<void> {
  const ids = poiIds.filter((id): id is string => Boolean(id))
  if (ids.length === 0) return
  try {
    await reassignFallbackImages({ poiIds: ids })
  } catch (error) {
    console.error('[fallback-images] recalcul impossible', error)
  }
}
