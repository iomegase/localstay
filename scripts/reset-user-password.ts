/**
 * Réinitialise le mot de passe (et/ou l'email) d'un compte Supabase Auth,
 * sans envoi de mail — via la clé service_role.
 *
 * Usage (Node >= 20.6 pour --env-file) :
 *   npx tsx --env-file=.env.local scripts/reset-user-password.ts \
 *     --email=marlenehourcade@gmail.com \
 *     --password="NouveauMotDePasse123!" \
 *     [--new-email=vraie.adresse@exemple.com]
 *
 * - --email      : email ACTUEL du compte à corriger (obligatoire)
 * - --password   : nouveau mot de passe (optionnel)
 * - --new-email  : nouvelle adresse email, marquée confirmée (optionnel)
 */
import { createClient } from '@supabase/supabase-js'

function arg(name: string): string | undefined {
  const prefix = `--${name}=`
  const found = process.argv.find(a => a.startsWith(prefix))
  return found ? found.slice(prefix.length) : undefined
}

const email = arg('email')
const password = arg('password')
const newEmail = arg('new-email')

if (!email) {
  console.error('❌ --email=<email actuel> est obligatoire')
  process.exit(1)
}
if (!password && !newEmail) {
  console.error('❌ Fournis au moins --password=<...> et/ou --new-email=<...>')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

async function findUserByEmail(target: string) {
  // listUsers est paginé (50/page par défaut) — on parcourt jusqu'à trouver.
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const match = data.users.find(u => u.email?.toLowerCase() === target.toLowerCase())
    if (match) return match
    if (data.users.length < 200) break // dernière page
  }
  return null
}

async function main() {
  const user = await findUserByEmail(email!)
  if (!user) {
    console.error(`❌ Aucun compte Auth avec l'email ${email}`)
    process.exit(1)
  }

  const attrs: { password?: string; email?: string; email_confirm?: boolean } = {}
  if (password) attrs.password = password
  if (newEmail) { attrs.email = newEmail; attrs.email_confirm = true }

  const { error } = await supabase.auth.admin.updateUserById(user.id, attrs)
  if (error) {
    console.error(`❌ Échec de la mise à jour : ${error.message}`)
    process.exit(1)
  }

  console.log('✓ Compte mis à jour')
  console.log(`  id            : ${user.id}`)
  console.log(`  email         : ${newEmail ?? user.email}`)
  if (password) console.log('  mot de passe  : (défini)')
}

main().catch(e => { console.error(e); process.exit(1) })
