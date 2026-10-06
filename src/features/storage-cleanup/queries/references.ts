import { prisma } from '@/shared/lib/prisma'

/**
 * Spec 070 BR-04 : toutes les URL encore référencées par une donnée active. Une copie
 * spec 063 ne compte que si sa photo d'origine est encore sur une fiche active.
 */
export async function loadReferencedStorageUrls(): Promise<Set<string>> {
  const [pois, mirrors, lodgingPhotos, customizations, blocks, instructions] = await Promise.all([
    prisma.pointOfInterest.findMany({ where: { deleted_at: null }, select: { photos: true } }),
    prisma.poiPhotoMirror.findMany({ where: { deleted_at: null }, select: { source_url: true, storage_url: true } }),
    prisma.lodgingPhoto.findMany({ where: { deleted_at: null }, select: { url: true } }),
    prisma.lodgingCustomization.findMany({ where: { deleted_at: null, cover_photo_url: { not: null } }, select: { cover_photo_url: true } }),
    prisma.lodgingPracticalBlock.findMany({ where: { deleted_at: null, photo_url: { not: null } }, select: { photo_url: true } }),
    prisma.lodgingArrivalInstruction.findMany({ where: { deleted_at: null }, select: { photos: true } }),
  ])

  const referenced = new Set<string>()
  for (const poi of pois) poi.photos.forEach(url => referenced.add(url))
  for (const mirror of mirrors) {
    if (referenced.has(mirror.source_url)) referenced.add(mirror.storage_url)
  }
  lodgingPhotos.forEach(photo => referenced.add(photo.url))
  customizations.forEach(item => item.cover_photo_url && referenced.add(item.cover_photo_url))
  blocks.forEach(block => block.photo_url && referenced.add(block.photo_url))
  instructions.forEach(instruction => instruction.photos.forEach(url => referenced.add(url)))
  return referenced
}

/**
 * Spec 070 AC-03-02 : photos du guide d'un logement (couverture, blocs pratiques,
 * arrivée). Lecture de nettoyage uniquement : une erreur renvoie une liste vide.
 */
export async function lodgingGuidePhotoUrls(lodgingId: string): Promise<string[]> {
  try {
    return await readLodgingGuidePhotoUrls(lodgingId)
  } catch (error) {
    console.error('[storage-cleanup] lecture des photos du logement impossible', error)
    return []
  }
}

async function readLodgingGuidePhotoUrls(lodgingId: string): Promise<string[]> {
  const [customization, blocks, instructions] = await Promise.all([
    prisma.lodgingCustomization.findUnique({ where: { lodging_id: lodgingId }, select: { cover_photo_url: true } }),
    prisma.lodgingPracticalBlock.findMany({ where: { lodging_id: lodgingId, deleted_at: null }, select: { photo_url: true } }),
    prisma.lodgingArrivalInstruction.findMany({ where: { lodging_id: lodgingId, deleted_at: null }, select: { photos: true } }),
  ])
  return [
    ...(customization?.cover_photo_url ? [customization.cover_photo_url] : []),
    ...blocks.flatMap(block => (block.photo_url ? [block.photo_url] : [])),
    ...instructions.flatMap(instruction => instruction.photos),
  ]
}

/** Spec 070 AC-03-01 : photos actuelles d'une fiche POI (liste vide en cas d'erreur). */
export async function poiPhotoUrls(poiId: string): Promise<string[]> {
  try {
    const poi = await prisma.pointOfInterest.findUnique({ where: { id: poiId }, select: { photos: true } })
    return poi?.photos ?? []
  } catch (error) {
    console.error('[storage-cleanup] lecture des photos du POI impossible', error)
    return []
  }
}
