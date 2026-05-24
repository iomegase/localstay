import { NextRequest, NextResponse } from 'next/server'
import { LoginSchema } from '@/features/auth/schemas'
import { createSupabaseRouteClient } from '@/shared/lib/supabase'
import { prisma } from '@/shared/lib/prisma'
import { DASHBOARD_ROUTES } from '@/shared/types/roles'
import type { Role } from '@/shared/types/roles'
import { getMerchantRedirect } from '@/features/merchant/lib/redirect'

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Corps de requête invalide' } },
      { status: 400 },
    )
  }

  const parsed = LoginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Paramètre manquant ou invalide', details: parsed.error.flatten() } },
      { status: 400 },
    )
  }

  const { email, password } = parsed.data
  const supabase = await createSupabaseRouteClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return NextResponse.json(
      { error: { code: 'INVALID_CREDENTIALS', message: 'Email ou mot de passe incorrect' } },
      { status: 401 },
    )
  }

  const user = await prisma.user.findFirst({
    where: { supabase_id: data.user.id, deleted_at: null },
    include: {
      subscriptions: {
        where: { deleted_at: null },
        orderBy: { created_at: 'desc' },
        take: 1,
      },
      merchant_profile: true,
      merchant_claims: {
        where: { deleted_at: null },
        orderBy: { created_at: 'desc' },
        take: 1,
      },
    },
  })

  if (!user) {
    return NextResponse.json(
      { error: { code: 'USER_NOT_FOUND', message: 'Compte introuvable' } },
      { status: 404 },
    )
  }

  // Sync role into Supabase user_metadata so the proxy can read it without a DB call
  if (data.user.user_metadata?.role !== user.role) {
    await supabase.auth.updateUser({ data: { role: user.role } })
  }

  const subscription = user.subscriptions[0] ?? null
  const role = user.role as Role

  const redirectTo = role === 'merchant'
    ? getMerchantRedirect(user)
    : role !== 'tourist'
      ? DASHBOARD_ROUTES[role as Exclude<Role, 'tourist'>]
      : '/'

  return NextResponse.json({
    user: { id: user.id, email: user.email, role: user.role, first_name: user.first_name, last_name: user.last_name },
    subscription: subscription
      ? { plan: subscription.plan, status: subscription.status, trial_ends_at: subscription.trial_ends_at }
      : null,
    redirect_to: redirectTo,
  })
}
