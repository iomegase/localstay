import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/shared/lib/prisma'
import { POI_PHOTO_MIRROR_TAG } from '../lib/mirror-cache-tag'

export type PoiPhotoMirrorMap = ReadonlyMap<string, string>

const loadMirrorPairs = unstable_cache(
  async (): Promise<Array<[string, string]>> => {
    const rows = await prisma.poiPhotoMirror.findMany({
      where: { deleted_at: null },
      select: { source_url: true, storage_url: true },
    })
    return rows.map(row => [row.source_url, row.storage_url])
  },
  ['poi-photo-mirror-map'],
  { tags: [POI_PHOTO_MIRROR_TAG], revalidate: 86_400 },
)

/** Spec 063 — correspondance URL d'origine → copie MyStay, une lecture par requête. */
export const getPoiPhotoMirrorMap = cache(async (): Promise<PoiPhotoMirrorMap> => {
  try {
    return new Map(await loadMirrorPairs())
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
