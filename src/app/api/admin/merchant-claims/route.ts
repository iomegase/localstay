import { NextRequest, NextResponse } from 'next/server'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { listPendingMerchantClaims } from '@/features/merchant/queries/admin-claims'

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const data = await listPendingMerchantClaims()
  return NextResponse.json({ data })
}
