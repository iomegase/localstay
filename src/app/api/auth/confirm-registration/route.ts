import { NextRequest, NextResponse } from 'next/server'
import { ConfirmRegistrationSchema } from '@/features/auth/schemas'
import { createSupabaseRouteClient } from '@/shared/lib/supabase'
import { getMerchantRedirect } from '@/features/merchant/lib/redirect'

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown
  try { body = await req.json() }
  catch {
    return NextResponse.json({ error: { code: 'INVALID_JSON', message: 'Corps de requête invalide', details: {} } }, { status: 400 })
  }
  const parsed = ConfirmRegistrationSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Lien de confirmation manquant ou invalide', details: {} } }, { status: 400 })

  try {
    const supabase = await createSupabaseRouteClient()
    const { token, code } = parsed.data
    const { data, error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ token_hash: token!, type: 'signup' })
    if (error || !data.user) return NextResponse.json({ error: { code: 'INVALID_TOKEN', message: 'Lien de confirmation invalide ou expiré', details: {} } }, { status: 400 })
    const role: unknown = data.user.user_metadata?.role
    if (role !== 'owner' && role !== 'merchant') return NextResponse.json({ error: { code: 'ROLE_NOT_ALLOWED', message: 'Ce compte ne peut pas accéder à cet espace', details: {} } }, { status: 403 })
    return NextResponse.json({ redirect_to: role === 'merchant' ? getMerchantRedirect({}) : '/dashboard' })
  } catch {
    console.error('[confirm-registration]', { code: 'CONFIRMATION_UNAVAILABLE' })
    return NextResponse.json({ error: { code: 'CONFIRMATION_UNAVAILABLE', message: 'Impossible de confirmer votre adresse pour le moment. Veuillez réessayer.', details: {} } }, { status: 503 })
  }
}
