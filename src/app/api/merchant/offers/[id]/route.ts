import { NextRequest, NextResponse } from 'next/server'
import { getSessionMerchant } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import {
  MerchantDashboardError,
  softDeleteMerchantOffer,
} from '@/features/merchant/queries/dashboard'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSessionMerchant()
  if (session.error) return session.error

  const { id } = await params

  try {
    await softDeleteMerchantOffer(session.user.id, id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof MerchantDashboardError) {
      if (error.code === 'OFFER_NOT_FOUND') {
        return apiError('NOT_FOUND', 'Offre introuvable', 404)
      }
      if (error.code === 'FORBIDDEN' || error.code === 'MERCHANT_PROFILE_NOT_ACTIVE') {
        return apiError('FORBIDDEN', 'Offre non liée au commerçant', 403)
      }
    }
    throw error
  }
}
