import { NextRequest, NextResponse } from 'next/server'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'
import { prisma } from '@/shared/lib/prisma'
import { uploadGuideImage } from '@/shared/lib/image-upload-service'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const { owner, error } = await getSessionOwner()
  if (error) return error

  const { id } = await params
  const lodging = await prisma.lodging.findFirst({
    where: { id, owner_id: owner.id, deleted_at: null },
    select: { id: true },
  })
  if (!lodging) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Logement introuvable' } }, { status: 404 })
  }

  const formData = await req.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: { code: 'VALIDATION', message: 'Fichier requis' } }, { status: 400 })
  }

  const result = await uploadGuideImage(file, `lodgings/${id}`)
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
