import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/lodging-showcase/lib/http'
import { deleteAdminLodgingPhoto, setAdminCoverPhoto } from '@/features/lodging-showcase/queries/owner-public-profile'

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
