import { NextRequest, NextResponse } from 'next/server'
import { resolveUploadFormat } from '@/shared/lib/image-upload'
import { uploadGuideImage } from '@/shared/lib/image-upload-service'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/lodging-showcase/lib/http'
import { LodgingPhotoRoomTypeSchema } from '@/features/lodging-showcase/schemas'
import { createAdminLodgingPhoto } from '@/features/lodging-showcase/queries/owner-public-profile'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionAdmin()
  if (!session.user) return session.error

  const formData = await req.formData()
  const file = formData.get('file')
  const alt = String(formData.get('alt') ?? '').trim()
  const roomTypeRaw = formData.get('room_type')

  if (!(file instanceof File)) {
    return apiError('VALIDATION_ERROR', 'Fichier manquant', 400)
  }

  if (alt.length < 5 || alt.length > 160) {
    return apiError('VALIDATION_ERROR', 'Texte alternatif invalide', 400)
  }

  if (!resolveUploadFormat(file.type)) {
    return apiError('VALIDATION_ERROR', 'Type de fichier non supporte', 400)
  }

  const roomType = roomTypeRaw
    ? LodgingPhotoRoomTypeSchema.safeParse(String(roomTypeRaw))
    : { success: true as const, data: null }

  if (!roomType.success) {
    return apiError('VALIDATION_ERROR', 'Type de piece invalide', 400, roomType.error.flatten())
  }

  const { id } = await params
  const upload = await uploadGuideImage(file, `lodgings/${id}/showcase`)

  if (!upload.ok) {
    if (upload.code === 'INVALID_TYPE' || upload.code === 'TOO_LARGE') {
      return apiError('VALIDATION_ERROR', 'Image invalide', 400, { uploadCode: upload.code })
    }

    return apiError('UPLOAD_FAILED', 'Upload impossible', 500)
  }

  const photo = await createAdminLodgingPhoto(id, {
    url: upload.url,
    alt,
    room_type: roomType.data,
  })

  if (!photo) {
    return apiError('LODGING_NOT_FOUND', 'Logement introuvable', 404)
  }

  return NextResponse.json(photo, { status: 201 })
}
