/**
 * Spec 062 — autorisation Google Business Profile, à lancer UNE fois en local :
 *   GOOGLE_BUSINESS_CLIENT_ID=… GOOGLE_BUSINESS_CLIENT_SECRET=… npx tsx scripts/google-business-auth.ts
 * Ouvre l'URL affichée, connectez-vous avec le compte propriétaire de la fiche MyStay,
 * puis copiez le refresh token et les identifiants dans les variables Vercel.
 */
import { createServer } from 'node:http'

const clientId = process.env.GOOGLE_BUSINESS_CLIENT_ID
const clientSecret = process.env.GOOGLE_BUSINESS_CLIENT_SECRET
if (!clientId || !clientSecret) {
  console.error('Renseignez GOOGLE_BUSINESS_CLIENT_ID et GOOGLE_BUSINESS_CLIENT_SECRET.')
  process.exit(1)
}

const port = 53682
const redirectUri = `http://127.0.0.1:${port}`
const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
authUrl.search = new URLSearchParams({
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: 'code',
  scope: 'https://www.googleapis.com/auth/business.manage',
  access_type: 'offline',
  prompt: 'consent',
}).toString()

type TokenResponse = { access_token?: string; refresh_token?: string; error?: string }
type Account = { name: string; accountName?: string }
type Location = { name: string; title?: string }

async function getJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) throw new Error(`${url} → ${response.status} ${await response.text()}`)
  return response.json() as Promise<T>
}

const server = createServer(async (req, res) => {
  const code = new URL(req.url ?? '/', redirectUri).searchParams.get('code')
  if (!code) {
    res.end('Code absent.')
    return
  }
  res.end('Autorisation reçue, vous pouvez fermer cet onglet.')
  server.close()

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code',
    }).toString(),
  })
  const tokens = await tokenResponse.json() as TokenResponse
  if (!tokens.refresh_token || !tokens.access_token) {
    console.error('Échec OAuth :', tokens.error ?? tokens)
    process.exit(1)
  }
  console.log(`\nGOOGLE_BUSINESS_REFRESH_TOKEN=${tokens.refresh_token}\n`)

  const { accounts = [] } = await getJson<{ accounts?: Account[] }>('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', tokens.access_token)
  for (const account of accounts) {
    const { locations = [] } = await getJson<{ locations?: Location[] }>(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title&pageSize=100`,
      tokens.access_token,
    )
    for (const location of locations) {
      console.log(`${location.title ?? '(sans titre)'} — GOOGLE_BUSINESS_ACCOUNT_ID=${account.name.split('/')[1]} GOOGLE_BUSINESS_LOCATION_ID=${location.name.split('/')[1]}`)
    }
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Ouvrez cette URL dans votre navigateur :\n\n${authUrl.toString()}\n`)
})
