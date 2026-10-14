import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { uploadGuideImage } from '@/shared/lib/image-upload-service'
import { UuidSchema } from '@/features/seminar-activities/lib/schemas'
import { seminarActivityErrorResponse, validationErrorResponse } from '@/features/seminar-activities/lib/api'
import { setSeminarActivityImage } from '@/features/seminar-activities/queries/admin'

/** Spec 097 AC-03 / BR-07 : image de l'activité, réencodée en WebP. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const id = UuidSchema.safeParse((await params).id)
  if (!id.success) return validationErrorResponse(id.error)
  const file = (await req.formData().catch(() => null))?.get('file')
  if (!(file instanceof File)) return apiError('VALIDATION_ERROR', 'Fichier requis', 400)

  const result = await uploadGuideImage(file, `seminar-activities/${id.data}`)
  if (!result.ok) {
    if (result.code === 'INVALID_TYPE') return apiError(result.code, 'Format non supporté (png, jpeg, webp, avif, heic)', 400)
    if (result.code === 'TOO_LARGE') return apiError(result.code, 'Image trop volumineuse', 413)
    return apiError(result.code, 'Upload impossible', 500)
  }

  try {
    const activity = await setSeminarActivityImage(id.data, result.url)
    // `url` permet de réutiliser le composant partagé ImageUpload.
    return NextResponse.json({ ...activity, url: result.url })
  } catch (error) {
    return seminarActivityErrorResponse(error)
  }
}
