import { prisma } from '@/shared/lib/prisma'
import { createSupabaseServer } from '@/shared/lib/supabase'
import { cleanablePath, GUIDE_PHOTOS_BUCKET, guidePhotoPath } from '../lib/storage-paths'
import { loadReferencedStorageUrls } from '../queries/references'

/**
 * Spec 070 US-03 : supprime du stockage les fichiers de ces URL qui ne sont plus
 * référencés (BR-04), dans `pois/` et `lodgings/` uniquement (BR-06). Un échec est
 * journalisé sans être propagé (AC-03-03) ; la tâche hebdomadaire le rattrape.
 */
export async function deleteUnreferencedFiles(urls: string[]): Promise<{ deleted: number }> {
  const candidates = [...new Set(urls)].filter(url => cleanablePath(url) !== null)
  if (candidates.length === 0) return { deleted: 0 }

  try {
    const referenced = await loadReferencedStorageUrls()
    const referencedPaths = new Set([...referenced].map(guidePhotoPath).filter((path): path is string => path !== null))
    const paths = candidates
      .map(url => cleanablePath(url)!)
      .filter(path => !referencedPaths.has(path))
    if (paths.length === 0) return { deleted: 0 }

    const { error } = await createSupabaseServer().storage.from(GUIDE_PHOTOS_BUCKET).remove(paths)
    if (error) throw error
    return { deleted: paths.length }
  } catch (error) {
    console.error('[storage-cleanup] suppression impossible', error)
    return { deleted: 0 }
  }
}

/**
 * Spec 070 AC-03-01 : photos retirées d'une fiche POI — leurs copies spec 063 sont
 * retirées (soft delete) puis les fichiers inutilisés supprimés.
 */
export async function cleanupRemovedPoiPhotos(poiId: string, removed: string[]): Promise<void> {
  if (removed.length === 0) return
  try {
    const mirrors = await prisma.poiPhotoMirror.findMany({
      where: { poi_id: poiId, deleted_at: null, source_url: { in: removed } },
      select: { id: true, storage_url: true },
    })
    if (mirrors.length > 0) {
      await prisma.poiPhotoMirror.updateMany({
        where: { id: { in: mirrors.map(mirror => mirror.id) } },
        data: { deleted_at: new Date() },
      })
    }
    await deleteUnreferencedFiles([...removed, ...mirrors.map(mirror => mirror.storage_url)])
  } catch (error) {
    console.error('[storage-cleanup] nettoyage des photos POI impossible', error)
  }
}
