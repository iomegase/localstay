import { ROOM_TYPE_LABELS } from './detail-view'

export type PhotoCategoryOption = { value: string; label: string; roomType: string; roomLabel: string | null }

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
      options.push({ value: `bathroom::${label}`, label, roomType: 'bathroom', roomLabel: label })
    }
  } else {
    options.push({ value: 'bathroom', label: ROOM_TYPE_LABELS.bathroom, roomType: 'bathroom', roomLabel: null })
  }

  for (const roomType of ['common_area', 'exterior', 'kitchen', 'other'] as const) {
    options.push({ value: roomType, label: ROOM_TYPE_LABELS[roomType], roomType, roomLabel: null })
  }

  return options
}

export function parsePhotoCategoryValue(value: string): { roomType: string; roomLabel: string | null } {
  const idx = value.indexOf('::')
  if (idx === -1) return { roomType: value, roomLabel: null }
  return { roomType: value.slice(0, idx), roomLabel: value.slice(idx + 2) }
}
