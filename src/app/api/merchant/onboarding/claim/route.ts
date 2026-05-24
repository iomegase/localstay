import { NextRequest, NextResponse } from 'next/server'
import { MerchantClaimCreateSchema } from '@/features/merchant/schemas'
import { getSessionMerchant } from '@/features/merchant/lib/session'
import { apiError, validationError } from '@/features/merchant/lib/responses'
import { createMerchantClaim } from '@/features/merchant/queries/onboarding'

function conflictFromError(error: unknown): NextResponse {
  const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
  if (code === 'MERCHANT_ALREADY_LINKED') {
    return apiError(code, 'Ce compte est déjà rattaché à un établissement', 409)
  }
  if (code === 'CLAIM_ALREADY_PENDING') {
    return apiError(code, 'Une demande est déjà en attente', 409)
  }
  if (code === 'POI_ALREADY_CLAIMED') {
    return apiError(code, 'Ce POI est déjà revendiqué', 409)
  }
  if (code === 'POI_NOT_CLAIMABLE') {
    return apiError(code, 'Ce POI ne peut pas être revendiqué', 409)
  }
  return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400)
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionMerchant()
  if (session.error) return session.error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return validationError({})
  }

  const parsed = MerchantClaimCreateSchema.safeParse(body)
  if (!parsed.success) return validationError(parsed.error.flatten())

  try {
    const data = await createMerchantClaim(session.user.id, parsed.data.poi_id)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return conflictFromError(error)
  }
}
