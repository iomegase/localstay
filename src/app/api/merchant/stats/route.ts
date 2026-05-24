import { NextRequest, NextResponse } from 'next/server'
import { getSessionMerchant } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { getMerchantStats, MerchantDashboardError } from '@/features/merchant/queries/dashboard'

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const session = await getSessionMerchant()
  if (session.error) return session.error

  try {
    const data = await getMerchantStats(session.user.id)
    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof MerchantDashboardError && error.code === 'MERCHANT_PROFILE_NOT_ACTIVE') {
      return apiError('FORBIDDEN', 'Profil commerçant inactif ou introuvable', 403)
    }
    throw error
  }
}
