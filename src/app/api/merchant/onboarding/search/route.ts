import { NextRequest, NextResponse } from 'next/server'
import { MerchantSearchSchema } from '@/features/merchant/schemas'
import { getSessionMerchant } from '@/features/merchant/lib/session'
import { validationError } from '@/features/merchant/lib/responses'
import { searchClaimablePois } from '@/features/merchant/queries/onboarding'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionMerchant()
  if (session.error) return session.error

  const parsed = MerchantSearchSchema.safeParse({
    q: req.nextUrl.searchParams.get('q') ?? '',
  })
  if (!parsed.success) return validationError(parsed.error.flatten())

  const data = await searchClaimablePois(parsed.data.q)
  return NextResponse.json({ data })
}
