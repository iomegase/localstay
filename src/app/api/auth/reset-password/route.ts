import { NextRequest, NextResponse } from 'next/server'
import { ResetPasswordSchema } from '@/features/auth/schemas'
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

  const parsed = ResetPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Paramètre manquant ou invalide', details: parsed.error.flatten() } },
      { status: 400 },
    )
  }

  const { token, password } = parsed.data
  const supabase = await createSupabaseRouteClient()

  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: 'recovery',
  })

  if (verifyError) {
    return NextResponse.json(
      { error: { code: 'INVALID_TOKEN', message: 'Lien invalide ou expiré' } },
      { status: 400 },
    )
  }

  const { error: updateError } = await supabase.auth.updateUser({ password })

  if (updateError) {
    return NextResponse.json(
      { error: { code: 'UPDATE_ERROR', message: 'Impossible de mettre à jour le mot de passe' } },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
