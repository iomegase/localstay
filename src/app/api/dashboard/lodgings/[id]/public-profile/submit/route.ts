import { NextRequest, NextResponse } from 'next/server'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'
import { apiError } from '@/features/lodging-showcase/lib/http'
import { submitOwnerPublicProfile } from '@/features/lodging-showcase/queries/owner-public-profile'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionOwner()
  if (!session.owner) return session.error

  const { id } = await params
  const result = await submitOwnerPublicProfile(session.owner.id, id)

  if (!result.ok) {
    if (result.code === 'LODGING_NOT_FOUND') {
      return apiError('LODGING_NOT_FOUND', 'Logement introuvable', 404)
    }

    return apiError(
      'PROFILE_INCOMPLETE',
      'Le profil doit etre complete avant la review',
      result.status,
      {
        missingFields: result.missingFields,
        warnings: 'warnings' in result ? result.warnings ?? [] : [],
      },
    )
  }

  return NextResponse.json(result.profile)
}
