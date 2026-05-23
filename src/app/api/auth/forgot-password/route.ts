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
  const supabase = await createSupabaseRouteClient()
  // Always return 200 — AC-04-01: même réponse si email inexistant
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${baseUrl}/auth/reset-password`,
  })

  return NextResponse.json({ success: true })
}
