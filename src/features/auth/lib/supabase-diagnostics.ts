// Non-secret metadata only. Never return the key or decoded JWT payload.
export function getSupabaseConfigurationDiagnostics() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  const key = publishableKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || ''
  const keySource = publishableKey ? 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  let project: string | null = null
  try {
    const hostname = new URL(url).hostname
    if (/^[a-z0-9]+\.supabase\.co$/.test(hostname)) project = hostname.split('.')[0]
  } catch { /* Invalid URL: retain null without logging the supplied value. */ }

  const keyKind = key.startsWith('sb_publishable_') ? 'publishable'
    : key.startsWith('sb_secret_') ? 'secret'
      : key.split('.').length === 3 ? 'jwt' : key ? 'unrecognized' : 'missing'
  let jwtRole: string | null = null
  let jwtProjectMatches: boolean | null = null
  let jwtExpired: boolean | null = null
  if (keyKind === 'jwt') {
    try {
      const payload: unknown = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'))
      if (payload && typeof payload === 'object') {
        const claims = payload as Record<string, unknown>
        if (typeof claims.role === 'string' && ['anon', 'service_role', 'authenticated'].includes(claims.role)) jwtRole = claims.role
        if (typeof claims.ref === 'string' && project) jwtProjectMatches = claims.ref === project
        if (typeof claims.exp === 'number') jwtExpired = claims.exp * 1000 <= Date.now()
      }
    } catch { /* Not a decodable JWT. Never log the error or token. */ }
  }

  return {
    project, keyKind, keySource, hasWhitespace: /\s/.test(key),
    hasOuterQuotes: /^["']|["']$/.test(key),
    publishableKeyConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()),
    jwtRole, jwtProjectMatches, jwtExpired,
  }
}
