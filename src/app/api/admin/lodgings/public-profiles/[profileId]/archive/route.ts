import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/lodging-showcase/lib/http'
import { archiveLodgingProfile } from '@/features/lodging-showcase/queries/admin-public-profiles'

const ParamsSchema = z.object({ profileId: z.string().uuid() })

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const session = await getSessionAdmin()
  if (!session.user) return session.error

  const parsed = ParamsSchema.safeParse(await params)
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Parametre invalide', 400, parsed.error.flatten())
  }

  const profile = await archiveLodgingProfile(parsed.data.profileId)
  if (!profile) {
    return apiError('NOT_FOUND', 'Fiche logement introuvable', 404)
  }

  return NextResponse.json(profile)
}
