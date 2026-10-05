import { cache } from 'react'
import { prisma } from '@/shared/lib/prisma'

export type PoiPhotoMirrorMap = ReadonlyMap<string, string>

/**
 * Spec 063 — correspondance URL d'origine → copie MyStay, lue une fois par requête
 * (une centaine de lignes). Pas de cache inter-requêtes : aucune invalidation à gérer.
 */
export const getPoiPhotoMirrorMap = cache(async (): Promise<PoiPhotoMirrorMap> => {
  try {
    const rows = await prisma.poiPhotoMirror.findMany({
      where: { deleted_at: null },
      select: { source_url: true, storage_url: true },
    })
    return new Map(rows.map(row => [row.source_url, row.storage_url]))
  } catch (error) {
    console.error('POI_PHOTO_MIRROR_MAP_UNAVAILABLE', error)
    return new Map()
  }
})

export function resolvePoiPhotoUrl(url: string, map: PoiPhotoMirrorMap): string {
  return map.get(url) ?? url
}

export function resolvePoiPhotoList(urls: readonly string[], map: PoiPhotoMirrorMap): string[] {
  return urls.map(url => resolvePoiPhotoUrl(url, map))
}
