// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { RegisterSchema } from '@/features/auth/schemas'
import { createTrialSubscription } from '@/features/auth/lib/subscription'
import { createSupabaseRouteClient } from '@/shared/lib/supabase'
import { prisma } from '@/shared/lib/prisma'
import { sendWelcomeEmail } from '@/shared/lib/resend'
import { DASHBOARD_ROUTES } from '@/shared/types/roles'
import { getMerchantRedirect } from '@/features/merchant/lib/redirect'
import { registerWithResend } from '@/features/auth/lib/registration-email'

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
  const conflict = () => NextResponse.json(
    { error: { code: 'EMAIL_CONFLICT', message: 'Cet email est déjà utilisé' } }, { status: 409 },
  )
  try {
    if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) return conflict()
  } catch {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: 'Erreur interne lors de la création du compte', details: {} } }, { status: 500 })
  }
  const supabase = await createSupabaseRouteClient()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const confirmationUrl = `${baseUrl.replace(/\/$/, '')}/auth/confirm-registration`

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role, first_name, last_name }, emailRedirectTo: confirmationUrl },
  })
  let authUser = data.user
  const confirmationRequired = !data.session

  if (error || !authUser) {
    const errMessage = error?.message ?? ''
    const errLower = errMessage.toLowerCase()
    if (errLower.includes('already registered') || ['email_exists', 'user_already_exists'].includes(error?.code ?? '')) return conflict()
    if (errLower.includes('rate limit') || error?.status === 429) {
      return NextResponse.json(
        {
          error: {
            code: 'EMAIL_RATE_LIMIT',
            message: 'L’envoi des emails est temporairement limité. Réessayez plus tard.',
          },
        },
        { status: 429 },
      )
    }
    console.error('[register]', { code: error?.code ?? 'SIGNUP_ERROR', status: error?.status })
    if (error?.status && error.status >= 500 && /sending.*confirmation.*email/i.test(errMessage)) {
      const delivery = await registerWithResend(parsed.data, confirmationUrl)
      if (delivery.status === 'conflict') return conflict()
      if (delivery.status !== 'sent') {
        const limited = delivery.status === 'limited'
        return NextResponse.json({ error: {
          code: limited ? 'EMAIL_RATE_LIMIT' : 'EMAIL_SEND_FAILED',
          message: limited ? 'L’envoi des emails est temporairement limité. Réessayez plus tard.' : 'Impossible d’envoyer l’email de confirmation pour le moment. Veuillez réessayer.',
          details: {},
        } }, { status: limited ? 429 : 503 })
      }
      authUser = delivery.user
    } else {
      return NextResponse.json({ error: { code: 'SIGNUP_ERROR', message: 'Impossible de créer le compte pour le moment. Veuillez réessayer.', details: {} } }, { status: 500 })
    }
  }
  if (!authUser || authUser.identities?.length === 0) return conflict()

  let user: { id: string; email: string; role: string; first_name: string | null; last_name: string | null }
  let subscription: { plan: string; status: string; trial_ends_at: Date }

  try {
    user = await prisma.user.create({
      data: {
        supabase_id: authUser.id,
        email,
        role,
        first_name,
        last_name,
      },
    })

    subscription = await createTrialSubscription(user.id)
  } catch {
    console.error('[register]', { code: 'DB_ERROR' })
    return NextResponse.json(
      {
        error: {
          code: 'DB_ERROR',
          message: 'Erreur interne lors de la création du compte',
          details: {},
        },
      },
      { status: 500 },
    )
  }

  // Fire-and-forget: registration must not fail if email delivery fails
  try {
    await sendWelcomeEmail({ to: email, firstName: first_name })
  } catch {
    console.error('[register]', { code: 'WELCOME_EMAIL_FAILED' })
  }

  // RegisterSchema constrains role to 'owner' | 'merchant', both of which are
  // valid keys of DASHBOARD_ROUTES — this cast is safe by construction.
  const redirectTo = role === 'merchant'
    ? getMerchantRedirect({})
    : DASHBOARD_ROUTES[role as keyof typeof DASHBOARD_ROUTES]

  return NextResponse.json(
    {
      user: { id: user.id, email: user.email, role: user.role, first_name: user.first_name, last_name: user.last_name },
      subscription: { plan: subscription.plan, status: subscription.status, trial_ends_at: subscription.trial_ends_at },
      redirect_to: redirectTo,
      confirmation_required: confirmationRequired,
    },
    { status: 201 },
  )
}
