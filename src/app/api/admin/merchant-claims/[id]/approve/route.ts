import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { approveMerchantClaim } from '@/features/merchant/queries/admin-claims'

function responseFromError(error: unknown): NextResponse {
  const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
  if (code === 'NOT_FOUND') return apiError('NOT_FOUND', 'Ressource introuvable', 404)
  if (code === 'CLAIM_ALREADY_REVIEWED') return apiError(code, 'Cette demande a déjà été traitée', 409)
  return apiError('VALIDATION_ERROR', 'Paramètre manquant ou invalide', 400)
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const { id } = await params
  try {
    const data = await approveMerchantClaim(id, session.user.id)
    return NextResponse.json({ data })
  } catch (error) {
    return responseFromError(error)
  }
}
