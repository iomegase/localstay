import { NextRequest, NextResponse } from 'next/server'
import { getSessionMerchant } from '@/features/merchant/lib/session'
import { apiError, validationError } from '@/features/merchant/lib/responses'
import { MerchantOfferCreateSchema } from '@/features/merchant/schemas'
import {
  createMerchantOffer,
  listMerchantOffers,
  MerchantDashboardError,
} from '@/features/merchant/queries/dashboard'

function handleMerchantOfferError(error: unknown): NextResponse {
  if (error instanceof MerchantDashboardError) {
    if (error.code === 'MERCHANT_PROFILE_NOT_ACTIVE') {
      return apiError('FORBIDDEN', 'Profil commerçant inactif ou introuvable', 403)
    }
    if (error.code === 'OFFER_LIMIT_REACHED') {
      return apiError('OFFER_LIMIT_REACHED', 'Limite de 3 offres actives atteinte', 409)
    }
  }
  throw error
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const session = await getSessionMerchant()
  if (session.error) return session.error

  try {
    const data = await listMerchantOffers(session.user.id)
    return NextResponse.json({ data })
  } catch (error) {
    return handleMerchantOfferError(error)
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSessionMerchant()
  if (session.error) return session.error

  const parsed = MerchantOfferCreateSchema.safeParse(await req.json())
  if (!parsed.success) return validationError({ issues: parsed.error.flatten() })

  try {
    const data = await createMerchantOffer(session.user.id, parsed.data)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return handleMerchantOfferError(error)
  }
}
