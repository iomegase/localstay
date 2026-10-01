import { LodgingPhotoCategoryInputSchema } from '@/features/lodging-showcase/schemas'
import { NextRequest, NextResponse } from 'next/server'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'
import { apiError } from '@/features/lodging-showcase/lib/http'
import { updateOwnerPhotoCategory, deleteOwnerLodgingPhoto, setOwnerCoverPhoto } from '@/features/lodging-showcase/queries/owner-public-profile'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const session = await getSessionOwner()
  if (!session.owner) return session.error
  const { id, photoId } = await params
  const ok = await deleteOwnerLodgingPhoto(session.owner.id, id, photoId)
  if (!ok) return apiError('PHOTO_NOT_FOUND', 'Photo introuvable', 404)
  return NextResponse.json({ ok: true })
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const session = await getSessionOwner()
  if (!session.owner) return session.error
  const { id, photoId } = await params
  const ok = await setOwnerCoverPhoto(session.owner.id, id, photoId)
  if (!ok) return apiError('PHOTO_NOT_FOUND', 'Photo introuvable', 404)
  return NextResponse.json({ ok: true })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const session = await getSessionOwner()
  if (!session.owner) return session.error
  const parsed = LodgingPhotoCategoryInputSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Catégorie invalide', 400, parsed.error.flatten())
  const { id, photoId } = await params
  const ok = await updateOwnerPhotoCategory(session.owner.id, id, photoId, parsed.data)
  if (!ok) return apiError('PHOTO_NOT_FOUND', 'Photo introuvable', 404)
  return NextResponse.json({ ok: true })
}
