import { NextRequest, NextResponse } from 'next/server'
import { ForgotPasswordSchema } from '@/features/auth/schemas'
import { createSupabaseRouteClient } from '@/shared/lib/supabase'

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

  const parsed = ForgotPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Email invalide', details: parsed.error.flatten() } },
      { status: 400 },
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  try {
    const supabase = await createSupabaseRouteClient()
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${baseUrl.replace(/\/$/, '')}/auth/reset-password`,
    })
    // Supabase returns no error for unknown accounts. Technical failures must
    // not be confused with that neutral response (AC-04-01).
    if (error) {
      console.error('[forgot-password]', { code: error.code, status: error.status })
      const limited = error.status === 429
      return NextResponse.json(
        { error: {
          code: limited ? 'EMAIL_RATE_LIMITED' : 'EMAIL_SEND_FAILED',
          message: limited
            ? 'L’envoi des emails est temporairement limité. Réessayez plus tard.'
            : 'Impossible d’envoyer le lien pour le moment. Veuillez réessayer.',
          details: {},
        } },
        { status: limited ? 429 : 503 },
      )
    }
  } catch {
    console.error('[forgot-password]', { code: 'EMAIL_SEND_FAILED' })
    return NextResponse.json(
      { error: { code: 'EMAIL_SEND_FAILED', message: 'Impossible d’envoyer le lien pour le moment. Veuillez réessayer.', details: {} } },
      { status: 503 },
    )
  }

  return NextResponse.json({ success: true })
}
