// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { RegisterSchema } from '@/features/auth/schemas'
import type { RegisterRole } from '@/features/auth/schemas'
import { createTrialSubscription } from '@/features/auth/lib/subscription'
import { createSupabaseRouteClient } from '@/shared/lib/supabase'
import { prisma } from '@/shared/lib/prisma'
import { sendWelcomeEmail } from '@/shared/lib/resend'
import { DASHBOARD_ROUTES } from '@/shared/types/roles'

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

  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Paramètre manquant ou invalide', details: parsed.error.flatten() } },
      { status: 400 },
    )
  }

  const { email, password, role, first_name, last_name } = parsed.data
  const supabase = await createSupabaseRouteClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role, first_name, last_name } },
  })

  if (error || !data.user) {
    if (error?.message?.toLowerCase().includes('already registered') || error?.status === 422) {
      return NextResponse.json(
        { error: { code: 'EMAIL_CONFLICT', message: 'Cet email est déjà utilisé' } },
        { status: 409 },
      )
    }
    return NextResponse.json(
      { error: { code: 'SIGNUP_ERROR', message: error?.message ?? 'Erreur lors de l\'inscription' } },
      { status: 500 },
    )
  }

  let user: { id: string; email: string; role: string; first_name: string | null; last_name: string | null }
  let subscription: { plan: string; status: string; trial_ends_at: Date }

  try {
    user = await prisma.user.create({
      data: {
        supabase_id: data.user.id,
        email,
        role,
        first_name,
        last_name,
      },
    })

    subscription = await createTrialSubscription(user.id)
  } catch {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Erreur interne' } },
      { status: 500 },
    )
  }

  // Fire-and-forget: registration must not fail if email delivery fails
  try {
    await sendWelcomeEmail({ to: email, firstName: first_name })
  } catch (err) {
    console.error('[register] sendWelcomeEmail failed:', err)
  }

  // RegisterSchema constrains role to 'owner' | 'merchant', both of which are
  // valid keys of DASHBOARD_ROUTES — this cast is safe by construction.
  const redirectTo = DASHBOARD_ROUTES[role as keyof typeof DASHBOARD_ROUTES]

  return NextResponse.json(
    {
      user: { id: user.id, email: user.email, role: user.role, first_name: user.first_name, last_name: user.last_name },
      subscription: { plan: subscription.plan, status: subscription.status, trial_ends_at: subscription.trial_ends_at },
      redirect_to: redirectTo,
    },
    { status: 201 },
  )
}
