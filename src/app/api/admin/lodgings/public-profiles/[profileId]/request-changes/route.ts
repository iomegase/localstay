import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/lodging-showcase/lib/http'
import { requestChangesLodgingProfile } from '@/features/lodging-showcase/queries/admin-public-profiles'

const ParamsSchema = z.object({ profileId: z.string().uuid() })
const BodySchema = z.object({
  admin_review_note: z.string().trim().min(5).max(1000),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const session = await getSessionAdmin()
  if (!session.user) return session.error

  const parsedParams = ParamsSchema.safeParse(await params)
  if (!parsedParams.success) {
    return apiError('VALIDATION_ERROR', 'Parametre invalide', 400, parsedParams.error.flatten())
  }

  const body = await req.json().catch(() => null)
  const parsedBody = BodySchema.safeParse(body)
  if (!parsedBody.success) {
    return apiError('VALIDATION_ERROR', 'Parametre invalide', 400, parsedBody.error.flatten())
  }

  const profile = await requestChangesLodgingProfile(
    parsedParams.data.profileId,
    parsedBody.data.admin_review_note,
  )

  if (!profile) {
    return apiError('NOT_FOUND', 'Fiche logement introuvable', 404)
  }

  return NextResponse.json(profile)
}
