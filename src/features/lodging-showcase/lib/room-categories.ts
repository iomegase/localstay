import { ROOM_TYPE_LABELS, groupRoomPhotos, isRenderableRoomPhoto, type RoomPhotoGroup } from './detail-view'

type Photo = Parameters<typeof groupRoomPhotos>[0][number]

/**
 * Catégories des pills de la grille « L'espace de vie » (spec 028 AC-02-11), dans l'ordre
 * d'affichage : Chambres et SdBs en tête (AC-02-28).
 */
export const ROOM_CATEGORIES = [
  { id: 'bedrooms', label: 'Chambres' },
  { id: 'bathrooms', label: 'SdBs' },
  { id: 'living', label: 'Salon' },
  { id: 'kitchen', label: 'Cuisine' },
  { id: 'wellness', label: 'Bien-être' },
  { id: 'leisure', label: 'Loisirs' },
  // Spec 028 AC-02-25 : pill affichée seulement si le logement a une salle de réunion.
  { id: 'meeting', label: 'Réunion' },
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
  'Salle de réunion': 'meeting',
  Bar: 'leisure',
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
 * chambres, salles de bain, puis le reste par nom (tri numérique, AC-02-27 / AC-02-28).
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
  // Spec 028 AC-02-27 (PO 2026-10-16) : dans une catégorie, cartes triées par nom avec
  // tri numérique (Chambre 1, 2… 10), au lieu de l'ordre des photos.
  const byName = (a: CategorizedRoomGroup, b: CategorizedRoomGroup) =>
    a.label.localeCompare(b.label, 'fr', { numeric: true, sensitivity: 'base' })
  // AC-02-28 : sous « Tout », chambres, puis salles de bain, puis tout le reste par ordre
  // alphabétique (comme le sélecteur de catégories de l'admin, AC-02-26).
  const rank = (group: CategorizedRoomGroup) => group.category === 'bedrooms' ? 0 : group.category === 'bathrooms' ? 1 : 2
  return [...groups].sort((a, b) => rank(a) - rank(b) || byName(a, b))
}
