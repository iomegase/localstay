import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { BlogPhotoUploadSchema } from '@/features/blog/schemas'
import { ApiBlogError, createBlogPhoto } from '@/features/blog/queries/admin-blog'
import { uploadGuideImage } from '@/shared/lib/image-upload-service'

type Context = {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, context: Context): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const formData = await req.formData()
  const parsed = BlogPhotoUploadSchema.safeParse({
    kind: formData.get('kind'),
    alt: formData.get('alt'),
    sort_order: formData.get('sort_order') ?? 0,
  })

  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400, parsed.error.flatten())
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400, { file: ['Fichier requis'] })
  }

  const { id } = await context.params
  const uploaded = await uploadGuideImage(file, `blog/${id}`)
  if (!uploaded.ok) {
    const status = uploaded.code === 'UPLOAD_FAILED' ? 500 : 400
    return apiError(uploaded.code, uploaded.code, status)
  }

  try {
    const photo = await createBlogPhoto(id, {
      ...parsed.data,
      url: uploaded.url,
    })
    return NextResponse.json(photo, { status: 201 })
  } catch (error) {
    if (error instanceof ApiBlogError) {
      return apiError(error.code, error.message, error.status, error.details)
    }
    return apiError('INTERNAL_ERROR', 'Erreur interne', 500)
  }
}
