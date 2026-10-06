import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { validationError } from '@/features/merchant/lib/responses'
import { createFallbackImages, listFallbackImages } from '@/features/fallback-images/queries/library'
import {
  FallbackImageListQuerySchema,
  MAX_FILES_PER_UPLOAD,
  responseFromFallbackImageError,
} from '@/features/fallback-images/lib/api'

// Spec 070 US-01 : médiathèque des images de remplacement.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const parsed = FallbackImageListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams))
  if (!parsed.success) return validationError(parsed.error.flatten())

  try {
    return NextResponse.json({ data: await listFallbackImages(parsed.data) })
  } catch (error) {
    return responseFromFallbackImageError(error)
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const form = await req.formData().catch(() => null)
  const files = form?.getAll('files').filter((entry): entry is File => entry instanceof File) ?? []
  if (files.length === 0 || files.length > MAX_FILES_PER_UPLOAD) {
    return validationError({ files: [`1 à ${MAX_FILES_PER_UPLOAD} fichiers par envoi`] })
  }

  try {
    return NextResponse.json({ data: await createFallbackImages(files) }, { status: 201 })
  } catch (error) {
    return responseFromFallbackImageError(error)
  }
}
