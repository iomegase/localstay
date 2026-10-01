import { ROOM_TYPE_LABELS, groupRoomPhotos, isRenderableRoomPhoto, type RoomPhotoGroup } from './detail-view'

type Photo = Parameters<typeof groupRoomPhotos>[0][number]

/** Catégories des pills de la grille « L'espace de vie » (spec 028 AC-02-11), dans l'ordre d'affichage. */
export const ROOM_CATEGORIES = [
  { id: 'living', label: 'Salon', roomTypes: ['common_area'] },
  { id: 'kitchen', label: 'Cuisine', roomTypes: ['kitchen'] },
  { id: 'bedrooms', label: 'Chambres', roomTypes: ['bedroom'] },
  { id: 'bathrooms', label: 'SdBs', roomTypes: ['bathroom'] },
  { id: 'exterior', label: 'Extérieur', roomTypes: ['exterior'] },
] as const

export type RoomCategoryId = (typeof ROOM_CATEGORIES)[number]['id']

export type CategorizedRoomGroup = RoomPhotoGroup & { category: RoomCategoryId }

/**
 * Regroupe les photos par pièce (comme `groupRoomPhotos`) puis range les cartes
 * par catégorie ; à l'intérieur d'une catégorie, l'ordre des photos est conservé.
 */
export function categorizeRoomGroups(photos: Photo[]): CategorizedRoomGroup[] {
  const typeByLabel = new Map<string, string>()
  for (const photo of [...photos].sort((a, b) => a.sort_order - b.sort_order)) {
    if (!isRenderableRoomPhoto(photo)) continue
    const label = photo.room_label ?? ROOM_TYPE_LABELS[photo.room_type as string]
    if (!typeByLabel.has(label)) typeByLabel.set(label, photo.room_type as string)
  }

  const groups = groupRoomPhotos(photos)
  return ROOM_CATEGORIES.flatMap(category =>
    groups
      .filter(group => (category.roomTypes as readonly string[]).includes(typeByLabel.get(group.label) ?? ''))
      .map(group => ({ ...group, category: category.id })),
  )
}
