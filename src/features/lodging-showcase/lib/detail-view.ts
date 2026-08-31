type Photo = {
  id: string
  url: string
  alt: string
  room_type: string | null
  room_label?: string | null
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

const LODGING_GALLERY_PHOTO_LIMIT = 3

export function selectLodgingGalleryPhotos<T>(photos: readonly T[]): T[] {
  return photos.slice(0, LODGING_GALLERY_PHOTO_LIMIT)
}

export function isRenderableRoomPhoto(photo: { room_type: string | null }): boolean {
  return photo.room_type != null
    && photo.room_type !== 'other'
    && ROOM_TYPE_LABELS[photo.room_type] != null
}

export function selectVisibleLodgingPhotos<T extends { room_type: string | null }>(
  photos: readonly T[],
): T[] {
  return photos.filter((photo, index) => (
    index < LODGING_GALLERY_PHOTO_LIMIT || isRenderableRoomPhoto(photo)
  ))
}

export function selectRoomPhotos(photos: Photo[]): Array<{ id: string; url: string; alt: string; label: string }> {
  return photos
    .filter(isRenderableRoomPhoto)
    .map(photo => ({ id: photo.id, url: photo.url, alt: photo.alt, label: photo.room_label ?? ROOM_TYPE_LABELS[photo.room_type as string] }))
}

export type RoomPhotoGroup = {
  label: string
  photos: Array<{ id: string; url: string; alt: string }>
}

/**
 * Groups room photos by their display label so several photos of the same room
 * (e.g. two "Extérieur" shots, or two photos of "Chambre 1") collapse into one
 * card. First-seen order is preserved.
 */
export function groupRoomPhotos(photos: Photo[]): RoomPhotoGroup[] {
  const order: string[] = []
  const byLabel = new Map<string, RoomPhotoGroup['photos']>()

  for (const room of selectRoomPhotos(photos)) {
    let bucket = byLabel.get(room.label)
    if (!bucket) {
      bucket = []
      byLabel.set(room.label, bucket)
      order.push(room.label)
    }
    bucket.push({ id: room.id, url: room.url, alt: room.alt })
  }

  return order.map(label => ({ label, photos: byLabel.get(label) as RoomPhotoGroup['photos'] }))
}

export function mapsDirectionUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
}
