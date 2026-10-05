import { LodgingPhotoItemSchema } from '../schemas'
import type { OwnerLodgingPublicProfileDto } from '../types'
import type { PhotoCategoryOption } from './photo-categories'

export async function uploadPhotos(options: {
  apiBase: string
  files: File[]
  alt: string
  title: string
  category: PhotoCategoryOption
  onUploaded: (photo: OwnerLodgingPublicProfileDto['photos'][number]) => void
  onProgress: (completed: number) => void
}) {
  const failures: Array<{ file: File; message: string }> = []
  for (const [index, file] of options.files.entries()) {
    try {
      const alt = options.alt.trim() || `${options.category.label} — ${options.title}`
      const body = new FormData()
      body.set('file', file)
      body.set('alt', alt.slice(0, 160))
      body.set('room_type', options.category.roomType)
      if (options.category.roomLabel) body.set('room_label', options.category.roomLabel)
      const response = await fetch(`${options.apiBase}/public-profile/photos`, { method: 'POST', body })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error?.message ?? 'Envoi impossible.')
      const photo = LodgingPhotoItemSchema.parse(payload)
      if (!photo.id) throw new Error('Réponse photo invalide.')
      options.onUploaded({ ...photo, id: photo.id, room_type: photo.room_type ?? null, room_label: photo.room_label ?? null })
    } catch (error) {
      failures.push({ file, message: error instanceof Error ? error.message : 'Envoi impossible.' })
    }
    options.onProgress(index + 1)
  }
  return failures
}
