import type { LodgingPhotoRoomType } from '../types'
import { ROOM_TYPE_LABELS } from './detail-view'

export type PhotoCategoryOption = { value: string; label: string; roomType: LodgingPhotoRoomType; roomLabel: string | null }

export function buildPhotoCategoryOptions(bedroomCount: number | null, bathroomCount: number | null): PhotoCategoryOption[] {
  const options: PhotoCategoryOption[] = []

  const bedrooms = Math.max(0, Math.floor(bedroomCount ?? 0))
  if (bedrooms >= 2) {
    for (let i = 1; i <= bedrooms; i += 1) {
      const label = `Chambre ${i}`
      options.push({ value: `bedroom::${label}`, label, roomType: 'bedroom', roomLabel: label })
    }
  } else {
    options.push({ value: 'bedroom', label: ROOM_TYPE_LABELS.bedroom, roomType: 'bedroom', roomLabel: null })
  }

  const bathrooms = Math.max(0, Math.ceil(bathroomCount ?? 0))
  if (bathrooms >= 2) {
    for (let i = 1; i <= bathrooms; i += 1) {
      const label = `Salle de bain ${i}`
      options.push({ value: `bathroom::${label}`, label: `Salle de bains ${i}`, roomType: 'bathroom', roomLabel: label })
    }
  } else {
    options.push({ value: 'bathroom', label: 'Salle de bains', roomType: 'bathroom', roomLabel: null })
  }

  for (const roomType of ['common_area', 'exterior', 'kitchen', 'other'] as const) {
    options.push({ value: roomType, label: ROOM_TYPE_LABELS[roomType], roomType, roomLabel: null })
  }

  const namedCategories: Array<{ label: string; roomType: LodgingPhotoRoomType }> = [
    { label: 'Salon', roomType: 'common_area' },
    { label: 'Terrasse', roomType: 'exterior' },
    { label: 'Piscine', roomType: 'common_area' },
    { label: 'Hammam', roomType: 'common_area' },
    { label: 'Jacuzzi', roomType: 'common_area' },
    { label: 'Cinéma', roomType: 'common_area' },
    { label: 'Salle à manger', roomType: 'common_area' },
    { label: 'Bowling', roomType: 'common_area' },
    { label: 'Parking', roomType: 'exterior' },
    { label: 'Skiroom', roomType: 'common_area' },
    { label: 'Sauna', roomType: 'common_area' },
    { label: 'Salle de sport', roomType: 'common_area' },
    { label: 'Bibliothèque', roomType: 'common_area' },
    { label: 'Entrée', roomType: 'common_area' },
    { label: 'Garage', roomType: 'common_area' },
  ]
  for (const { label, roomType } of namedCategories) {
    options.push({ value: `${roomType}::${label}`, label, roomType, roomLabel: label })
  }
  return options
}

export function parsePhotoCategoryValue(value: string): { roomType: string; roomLabel: string | null } {
  const idx = value.indexOf('::')
  if (idx === -1) return { roomType: value, roomLabel: null }
  return { roomType: value.slice(0, idx), roomLabel: value.slice(idx + 2) }
}
