import { NextRequest, NextResponse } from 'next/server'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'
import { apiError } from '@/features/lodging-showcase/lib/http'
import { SourceUrlInputSchema } from '@/features/lodging-showcase/schemas'
import { saveSourceListingUrl } from '@/features/lodging-showcase/queries/owner-public-profile'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionOwner()
  if (!session.owner) return session.error

  const body = await req.json().catch(() => null)
  const parsed = SourceUrlInputSchema.safeParse(body)

  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Parametre manquant ou invalide', 400, parsed.error.flatten())
  }

  const { id } = await params
  const payload = await saveSourceListingUrl(session.owner.id, id, parsed.data)

  if (!payload) {
    return apiError('LODGING_NOT_FOUND', 'Logement introuvable', 404)
  }

  return NextResponse.json(payload)
}
