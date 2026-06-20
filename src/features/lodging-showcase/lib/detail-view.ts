type Photo = {
  id: string
  url: string
  alt: string
  room_type: string | null
  sort_order: number
  is_cover: boolean
}

export const ROOM_TYPE_LABELS: Record<string, string> = {
  bedroom: 'Chambre',
  bathroom: 'Salle de bain',
  common_area: 'Pièce de vie',
  exterior: 'Extérieur',
  kitchen: 'Cuisine',
  other: 'Autre',
}

export function selectRoomPhotos(photos: Photo[]): Array<{ id: string; url: string; alt: string; label: string }> {
  return photos
    .filter(photo => photo.room_type != null && photo.room_type !== 'other' && ROOM_TYPE_LABELS[photo.room_type] != null)
    .map(photo => ({ id: photo.id, url: photo.url, alt: photo.alt, label: ROOM_TYPE_LABELS[photo.room_type as string] }))
}

export function partitionAmenities(included: string[], onRequest: string[]): { included: string[]; onRequest: string[] } {
  return { included, onRequest }
}

export function mapsDirectionUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
}
