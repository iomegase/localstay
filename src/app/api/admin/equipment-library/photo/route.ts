import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { uploadGuideImage } from '@/shared/lib/image-upload-service'

/** Spec 096 BR-01 : seul l'admin téléverse la photo d'un équipement. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const file = (await req.formData().catch(() => null))?.get('file')
  if (!(file instanceof File)) return apiError('VALIDATION_ERROR', 'Fichier requis', 400)

  const result = await uploadGuideImage(file, 'equipment')
  if (!result.ok) {
    if (result.code === 'INVALID_TYPE') return apiError(result.code, 'Format non supporté (png, jpeg, webp, avif)', 400)
    if (result.code === 'TOO_LARGE') return apiError(result.code, 'Image trop volumineuse (max 5 Mo)', 400)
    return apiError(result.code, 'Upload impossible', 500)
  }
  return NextResponse.json({ url: result.url }, { status: 201 })
}
