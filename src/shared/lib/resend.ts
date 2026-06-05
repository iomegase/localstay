import { Resend } from 'resend'

interface WelcomeEmailParams {
  to: string
  firstName: string
}

interface ContactReplyEmailParams {
  to: string
  senderName: string
  subject: string
  originalMessage: string
  replyBody: string
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export async function sendWelcomeEmail({ to, firstName }: WelcomeEmailParams): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'MyStay <hello@mystay.fr>',
    to,
    subject: 'Bienvenue sur MyStay',
    html: `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; background: #FAF9F6;">
        <h1 style="font-family: 'Playfair Display', serif; font-style: italic; color: #121212; font-size: 28px; margin-bottom: 16px;">
          Bienvenue, ${firstName} 👋
        </h1>
        <p style="color: #121212; font-size: 16px; line-height: 1.6;">
          Votre compte MyStay a bien été créé. Vous bénéficiez d'un accès gratuit pendant 12 mois.
        </p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/dashboard"
           style="display: inline-block; margin-top: 24px; padding: 12px 24px; background: #455E4C; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Accéder à mon espace
        </a>
        <p style="color: #888; font-size: 12px; margin-top: 40px;">
          MyStay — Votre guide touristique local intelligent
        </p>
      </div>
    `,
  })
}

export async function sendContactReplyEmail({
  to,
  senderName,
  subject,
  originalMessage,
  replyBody,
}: ContactReplyEmailParams): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'MyStay <hello@mystay.fr>',
    to,
    subject: `Réponse MyStay — ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 32px 24px; background: #FAF9F6;">
        <h1 style="color: #121212; font-size: 24px; margin-bottom: 16px;">Réponse à votre message</h1>
        <p style="color: #333; font-size: 15px; line-height: 1.6;">Bonjour ${escapeHtml(senderName)},</p>
        <div style="margin: 20px 0; padding: 18px; background: #fff; border-radius: 12px; border: 1px solid #eee;">
          <p style="white-space: pre-wrap; color: #121212; font-size: 15px; line-height: 1.6;">${escapeHtml(replyBody)}</p>
        </div>
        <p style="color: #666; font-size: 13px; line-height: 1.6;">Votre message initial :</p>
        <blockquote style="margin: 8px 0 0; padding-left: 14px; border-left: 3px solid #ddd; color: #666; white-space: pre-wrap;">${escapeHtml(originalMessage)}</blockquote>
        <p style="color: #888; font-size: 12px; margin-top: 32px;">MyStay — Votre guide touristique local intelligent</p>
      </div>
    `,
  })

  return true
}
