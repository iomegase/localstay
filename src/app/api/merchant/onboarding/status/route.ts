import { NextRequest, NextResponse } from 'next/server'
import { getSessionMerchant } from '@/features/merchant/lib/session'
import { getMerchantOnboardingStatus } from '@/features/merchant/queries/onboarding'

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const session = await getSessionMerchant()
  if (session.error) return session.error

  const data = await getMerchantOnboardingStatus(session.user.id)
  return NextResponse.json({ data })
}
