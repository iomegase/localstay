import { LodgingPhotoCategoryInputSchema } from '@/features/lodging-showcase/schemas'
import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/lodging-showcase/lib/http'
import { updateAdminPhotoCategory, deleteAdminLodgingPhoto, setAdminCoverPhoto } from '@/features/lodging-showcase/queries/owner-public-profile'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const session = await getSessionAdmin()
  if (!session.user) return session.error
  const { id, photoId } = await params
  const ok = await deleteAdminLodgingPhoto(id, photoId)
  if (!ok) return apiError('PHOTO_NOT_FOUND', 'Photo introuvable', 404)
  return NextResponse.json({ ok: true })
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const session = await getSessionAdmin()
  if (!session.user) return session.error
  const { id, photoId } = await params
  const ok = await setAdminCoverPhoto(id, photoId)
  if (!ok) return apiError('PHOTO_NOT_FOUND', 'Photo introuvable', 404)
  return NextResponse.json({ ok: true })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const session = await getSessionAdmin()
  if (!session.user) return session.error
  const parsed = LodgingPhotoCategoryInputSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Catégorie invalide', 400, parsed.error.flatten())
  const { id, photoId } = await params
  const ok = await updateAdminPhotoCategory(id, photoId, parsed.data)
  if (!ok) return apiError('PHOTO_NOT_FOUND', 'Photo introuvable', 404)
  return NextResponse.json({ ok: true })
}
