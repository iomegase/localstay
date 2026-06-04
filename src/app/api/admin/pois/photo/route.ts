import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { uploadGuideImage } from '@/shared/lib/image-upload-service'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const formData = await req.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: { code: 'VALIDATION', message: 'Fichier requis' } }, { status: 400 })
  }

  const result = await uploadGuideImage(file, 'pois')
  if (!result.ok) {
    if (result.code === 'INVALID_TYPE') {
      return NextResponse.json({ error: { code: result.code, message: 'Format non supporté (png, jpeg, webp, avif)' } }, { status: 400 })
    }
    if (result.code === 'TOO_LARGE') {
      return NextResponse.json({ error: { code: result.code, message: 'Image trop volumineuse (max 5 Mo)' } }, { status: 400 })
    }
    return NextResponse.json({ error: { code: result.code, message: 'Upload impossible' } }, { status: 500 })
  }

  return NextResponse.json({ url: result.url }, { status: 201 })
}
