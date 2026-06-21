import { NextRequest, NextResponse } from 'next/server'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'
import { apiError } from '@/features/lodging-showcase/lib/http'
import { deleteOwnerLodgingPhoto, setOwnerCoverPhoto } from '@/features/lodging-showcase/queries/owner-public-profile'

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
