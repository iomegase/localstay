import { NextRequest, NextResponse } from 'next/server'
import { getSessionMerchant } from '@/features/merchant/lib/session'
import { apiError, validationError } from '@/features/merchant/lib/responses'
import { MerchantProfilePatchSchema } from '@/features/merchant/schemas'
import {
  getMerchantDashboardProfile,
  MerchantDashboardError,
  updateMerchantDashboardProfile,
} from '@/features/merchant/queries/dashboard'

function dashboardError(error: unknown): NextResponse {
  if (error instanceof MerchantDashboardError && error.code === 'MERCHANT_PROFILE_NOT_ACTIVE') {
    return apiError('FORBIDDEN', 'Profil commerçant inactif ou introuvable', 403)
  }
  throw error
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const session = await getSessionMerchant()
  if (session.error) return session.error

  try {
    const data = await getMerchantDashboardProfile(session.user.id)
    return NextResponse.json({ data })
  } catch (error) {
    return dashboardError(error)
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionMerchant()
  if (session.error) return session.error

  const parsed = MerchantProfilePatchSchema.safeParse(await req.json())
  if (!parsed.success) return validationError({ issues: parsed.error.flatten() })

  try {
    const data = await updateMerchantDashboardProfile(session.user.id, parsed.data)
    return NextResponse.json({ data })
  } catch (error) {
    return dashboardError(error)
  }
}
