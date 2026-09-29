import type { User } from '@supabase/supabase-js'
import { Resend } from 'resend'
import type { RegisterInput } from '@/features/auth/schemas'
import { createSupabaseServer } from '@/shared/lib/supabase'

type RegistrationDelivery = { status: 'sent'; user: User }
  | { status: 'conflict' | 'limited' | 'unavailable' }

export async function registerWithResend(input: RegisterInput, redirectTo: string): Promise<RegistrationDelivery> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { status: 'unavailable' }

  try {
    const supabase = createSupabaseServer()
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'signup', email: input.email, password: input.password,
      options: { redirectTo, data: { role: input.role, first_name: input.first_name, last_name: input.last_name } },
    })
    if (error) {
      if (['email_exists', 'user_already_exists'].includes(error.code ?? '') || /already.*registered/i.test(error.message)) return { status: 'conflict' }
      console.error('[registration-email]', { code: 'SIGNUP_LINK_FAILED', status: error.status })
      return { status: error.status === 429 ? 'limited' : 'unavailable' }
    }
    const token = data.properties?.hashed_token
    if (!token || data.properties.verification_type !== 'signup' || !data.user?.id || data.user.email_confirmed_at) return { status: 'unavailable' }

    const link = new URL(redirectTo)
    link.searchParams.set('token_hash', token)
    const resend = new Resend(apiKey)
    const sent = await resend.emails.send({
      from: 'MyStay <bonjour@mystay.city>', to: input.email,
      subject: 'Confirmez votre adresse email MyStay',
      text: ['Bonjour,', '', 'Pour confirmer votre adresse email et accéder à votre compte MyStay, ouvrez ce lien :',
        link.toString(), '', 'Si vous n’avez pas demandé ce compte, ignorez cet email.'].join('\n'),
    })
    if (sent.error || !sent.data?.id) {
      console.error('[registration-email]', { code: 'SIGNUP_EMAIL_REJECTED', status: sent.error?.statusCode })
      return { status: sent.error?.statusCode === 429 ? 'limited' : 'unavailable' }
    }
    console.info('[registration-email]', { code: 'SIGNUP_EMAIL_ACCEPTED', emailId: sent.data.id })
    return { status: 'sent', user: data.user }
  } catch {
    console.error('[registration-email]', { code: 'SIGNUP_EMAIL_FAILED' })
    return { status: 'unavailable' }
  }
}
