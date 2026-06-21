import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/lodging-showcase/lib/http'
import { LodgingPublicProfileInputSchema } from '@/features/lodging-showcase/schemas'
import { saveAdminPublicProfile } from '@/features/lodging-showcase/queries/owner-public-profile'
import { revalidatePublicLodgingPaths } from '@/features/lodging-showcase/lib/revalidation'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionAdmin()
  if (!session.user) return session.error

  const body = await req.json().catch(() => null)
  const parsed = LodgingPublicProfileInputSchema.safeParse(body)

  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Parametre manquant ou invalide', 400, parsed.error.flatten())
  }

  const { id } = await params
  const profile = await saveAdminPublicProfile(id, parsed.data)

  if (!profile) {
    return apiError('LODGING_NOT_FOUND', 'Logement introuvable', 404)
  }

  revalidatePublicLodgingPaths()

  return NextResponse.json(profile)
}
