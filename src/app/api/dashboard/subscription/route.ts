import { NextResponse } from 'next/server'
import { getSessionOwner } from '@/features/dashboard-owner/lib/get-session-owner'
import { getOwnerSubscriptionDetail } from '@/features/subscription-owner/queries/subscription'

export async function GET(): Promise<NextResponse> {
  const { owner, error } = await getSessionOwner()
  if (!owner) return error

  try {
    const subscription = await getOwnerSubscriptionDetail(owner.id)
    return NextResponse.json(subscription)
  } catch (err) {
    if (err instanceof Error && err.message === 'SUBSCRIPTION_NOT_FOUND') {
      return NextResponse.json(
        { error: { code: 'SUBSCRIPTION_NOT_FOUND', message: 'Abonnement introuvable', details: {} } },
        { status: 404 },
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Erreur interne', details: {} } },
      { status: 500 },
    )
  }
}
