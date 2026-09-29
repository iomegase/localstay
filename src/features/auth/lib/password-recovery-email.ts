import { Resend } from 'resend'
import { createSupabaseServer } from '@/shared/lib/supabase'

type RecoveryDelivery = 'sent' | 'unknown' | 'limited' | 'unavailable'

export async function sendRecoveryEmailViaResend(email: string, redirectTo: string): Promise<RecoveryDelivery> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return 'unavailable'

  try {
    const supabase = createSupabaseServer()
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery', email, options: { redirectTo },
    })
    if (error) {
      if (error.code === 'user_not_found') return 'unknown'
      console.error('[password-recovery-email]', { code: 'RECOVERY_LINK_FAILED', status: error.status })
      return error.status === 429 ? 'limited' : 'unavailable'
    }

    const token = data?.properties?.hashed_token
    if (!token || data.properties.verification_type !== 'recovery') return 'unavailable'
    const link = new URL(redirectTo)
    link.searchParams.set('token_hash', token)

    const resend = new Resend(apiKey)
    const sent = await resend.emails.send({
      from: 'MyStay <bonjour@mystay.city>',
      to: email,
      subject: 'Réinitialisez votre mot de passe MyStay',
      text: [
        'Bonjour,', '',
        'Pour définir un nouveau mot de passe MyStay, ouvrez ce lien :',
        link.toString(), '',
        'Si vous n’avez pas demandé cette réinitialisation, ignorez cet email.',
        'Votre mot de passe reste inchangé tant que vous ne le modifiez pas.',
      ].join('\n'),
    })
    if (sent.error || !sent.data?.id) {
      console.error('[password-recovery-email]', { code: 'RECOVERY_EMAIL_REJECTED', status: sent.error?.statusCode })
      return sent.error?.statusCode === 429 ? 'limited' : 'unavailable'
    }
    console.info('[password-recovery-email]', { code: 'RECOVERY_EMAIL_ACCEPTED', emailId: sent.data.id })
    return 'sent'
  } catch {
    console.error('[password-recovery-email]', { code: 'RECOVERY_EMAIL_FAILED' })
    return 'unavailable'
  }
}
