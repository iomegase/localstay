import { Resend } from 'resend'

interface WelcomeEmailParams {
  to: string
  firstName: string
}

export async function sendWelcomeEmail({ to, firstName }: WelcomeEmailParams): Promise<void> {
  if (!process.env.RESEND_API_KEY) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'StayLocal <hello@staylocal.fr>',
    to,
    subject: 'Bienvenue sur StayLocal',
    html: `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; background: #FAF9F6;">
        <h1 style="font-family: 'Playfair Display', serif; font-style: italic; color: #121212; font-size: 28px; margin-bottom: 16px;">
          Bienvenue, ${firstName} 👋
        </h1>
        <p style="color: #121212; font-size: 16px; line-height: 1.6;">
          Votre compte StayLocal a bien été créé. Vous bénéficiez d'un accès gratuit pendant 12 mois.
        </p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/dashboard"
           style="display: inline-block; margin-top: 24px; padding: 12px 24px; background: #455E4C; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Accéder à mon espace
        </a>
        <p style="color: #888; font-size: 12px; margin-top: 40px;">
          StayLocal — Votre guide touristique local intelligent
        </p>
      </div>
    `,
  })
}
