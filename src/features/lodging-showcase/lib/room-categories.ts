import { ROOM_TYPE_LABELS, groupRoomPhotos, isRenderableRoomPhoto, type RoomPhotoGroup } from './detail-view'

type Photo = Parameters<typeof groupRoomPhotos>[0][number]

/** Catégories des pills de la grille « L'espace de vie » (spec 028 AC-02-11), dans l'ordre d'affichage. */
export const ROOM_CATEGORIES = [
  { id: 'living', label: 'Salon' },
  { id: 'kitchen', label: 'Cuisine' },
  { id: 'bedrooms', label: 'Chambres' },
  { id: 'bathrooms', label: 'SdBs' },
  { id: 'wellness', label: 'Bien-être' },
  { id: 'leisure', label: 'Loisirs' },
  { id: 'entry', label: 'Entrée' },
  { id: 'exterior', label: 'Extérieur' },
] as const

export type RoomCategoryId = (typeof ROOM_CATEGORIES)[number]['id']

export type CategorizedRoomGroup = RoomPhotoGroup & { category: RoomCategoryId }

// Pièces communes (`common_area`) réparties selon leur nom ; les autres restent dans « Salon ».
const COMMON_AREA_CATEGORY_BY_LABEL: Record<string, RoomCategoryId> = {
  Jacuzzi: 'wellness',
  Sauna: 'wellness',
  Piscine: 'wellness',
  Hammam: 'wellness',
  'Salle de sport': 'wellness',
  'Cinéma': 'leisure',
  Bowling: 'leisure',
  'Bibliothèque': 'leisure',
  'Entrée': 'entry',
  Skiroom: 'entry',
  Garage: 'entry',
}

const CATEGORY_BY_ROOM_TYPE: Record<string, RoomCategoryId> = {
  common_area: 'living',
  kitchen: 'kitchen',
  bedroom: 'bedrooms',
  bathroom: 'bathrooms',
  exterior: 'exterior',
}

function categoryOf(roomType: string, label: string): RoomCategoryId | null {
  if (roomType === 'common_area') return COMMON_AREA_CATEGORY_BY_LABEL[label] ?? 'living'
  return CATEGORY_BY_ROOM_TYPE[roomType] ?? null
}

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

  const groups = groupRoomPhotos(photos).flatMap(group => {
    const category = categoryOf(typeByLabel.get(group.label) ?? '', group.label)
    return category ? [{ ...group, category }] : []
  })
  return ROOM_CATEGORIES.flatMap(category => groups.filter(group => group.category === category.id))
}
