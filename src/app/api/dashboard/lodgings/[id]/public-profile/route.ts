import { NextRequest, NextResponse } from 'next/server'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'
import { apiError } from '@/features/lodging-showcase/lib/http'
import { LodgingPublicProfileInputSchema } from '@/features/lodging-showcase/schemas'
import {
  getOwnerPublicProfile,
  saveOwnerPublicProfile,
} from '@/features/lodging-showcase/queries/owner-public-profile'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionOwner()
  if (!session.owner) return session.error

  const { id } = await params
  const profile = await getOwnerPublicProfile(session.owner.id, id)

  if (!profile) {
    return apiError('LODGING_NOT_FOUND', 'Logement introuvable', 404)
  }

  return NextResponse.json(profile)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionOwner()
  if (!session.owner) return session.error

  const body = await req.json().catch(() => null)
  const parsed = LodgingPublicProfileInputSchema.safeParse(body)

  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Parametre manquant ou invalide', 400, parsed.error.flatten())
  }

  const { id } = await params
  const profile = await saveOwnerPublicProfile(session.owner.id, id, parsed.data)

  if (!profile) {
    return apiError('LODGING_NOT_FOUND', 'Logement introuvable', 404)
  }

  return NextResponse.json(profile)
}
