import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

class ConfigurationError extends Error {}

const recoveryTemplate = '<h2>Nouveau mot de passe MyStay</h2><p>Une demande de réinitialisation a été reçue pour votre compte.</p><p><a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}">Définir mon nouveau mot de passe</a></p><p>Si vous n’avez pas fait cette demande, ignorez cet email.</p>'

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply')
  const smtpSettings = {
    smtp_host: 'smtp.resend.com',
    smtp_port: '465',
    smtp_user: 'resend',
    smtp_admin_email: 'bonjour@mystay.city',
    smtp_sender_name: 'MyStay',
    mailer_subjects_recovery: 'Réinitialiser votre mot de passe MyStay',
    mailer_templates_recovery_content: recoveryTemplate,
  }

  if (!apply) {
    console.log(JSON.stringify({
      mode: 'preview',
      settings: smtpSettings,
      password: 'RESEND_API_KEY (jamais affichée)',
      prerequisites: {
        managementAccess: Boolean(process.env.SUPABASE_ACCESS_TOKEN?.trim()),
        resendKey: Boolean(process.env.RESEND_API_KEY?.trim()),
      },
    }, null, 2))
    return
  }

  const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim()
  const resendKey = process.env.RESEND_API_KEY?.trim()
  if (!accessToken || !resendKey) {
    throw new ConfigurationError('SUPABASE_ACCESS_TOKEN et RESEND_API_KEY requis. Aucune configuration modifiée.')
  }
  const hostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname
  if (!/^[a-z0-9]+\.supabase\.co$/.test(hostname)) {
    throw new ConfigurationError('URL du projet Supabase hébergé invalide. Aucune configuration modifiée.')
  }
  const projectRef = hostname.split('.')[0]
  const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`
  const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
  const currentResponse = await fetch(endpoint, { headers, signal: AbortSignal.timeout(15000) })
  if (!currentResponse.ok) throw new ConfigurationError(`Lecture de configuration refusée (HTTP ${currentResponse.status}).`)
  const current: { uri_allow_list?: string } = await currentResponse.json()
  const allowList = new Set((current.uri_allow_list ?? '').split(',').map(value => value.trim()).filter(Boolean))
  allowList.add('https://www.mystay.city/auth/reset-password')
  // Preserve existing redirect destinations. Local development must use its
  // own trusted NEXT_PUBLIC_BASE_URL and an explicitly configured allow list.
  const response = await fetch(endpoint, {
    method: 'PATCH', headers,
    body: JSON.stringify({ ...smtpSettings, smtp_pass: resendKey, uri_allow_list: [...allowList].join(',') }),
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new ConfigurationError(`Configuration refusée (HTTP ${response.status}).`)
  // The management response contains secrets: never print it.
  console.log('SMTP Resend et modèle de réinitialisation configurés. Vérifier un envoi réel avant de conclure.')
}

main().catch((error: unknown) => {
  // Only our own configuration failures carry messages that are safe to show.
  const message = error instanceof ConfigurationError
    ? error.message : 'Échec de connexion à Supabase. Aucun détail sensible affiché.'
  console.error(message)
  process.exitCode = 1
})
