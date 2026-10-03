import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError, validationError } from '@/features/merchant/lib/responses'
import { uploadGuideImage } from '@/shared/lib/image-upload-service'

type Context = { params: Promise<{ slug: string }> }
const slugSchema = z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

export async function POST(request: NextRequest, context: Context): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error
  const slug = slugSchema.safeParse((await context.params).slug)
  if (!slug.success) return validationError({ slug: ['Identifiant de ville invalide.'] })
  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) return apiError('VALIDATION_ERROR', 'Image requise.', 400)

  const result = await uploadGuideImage(file, `transport-cards/${slug.data}`)
  if (!result.ok) {
    if (result.code === 'INVALID_TYPE') return apiError('INVALID_TYPE', 'Format non pris en charge.', 400)
    if (result.code === 'TOO_LARGE') return apiError('TOO_LARGE', 'Image trop volumineuse (5 Mo max).', 400)
    return apiError('UPLOAD_FAILED', 'Téléversement impossible.', 500)
  }
  return NextResponse.json({ url: result.url }, { status: 201 })
}
