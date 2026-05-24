/**
 * Creates 3 dev accounts in Supabase Auth + User table.
 * Run once: npx ts-node --project tsconfig.scripts.json scripts/create-dev-users.ts
 */
import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const prisma = new PrismaClient()

const USERS = [
  { email: 'admin@staylocal.dev',    password: 'StayLocal2026!', role: 'admin'    },
  { email: 'merchant@staylocal.dev', password: 'StayLocal2026!', role: 'merchant' },
  { email: 'owner@staylocal.dev',    password: 'StayLocal2026!', role: 'owner'    },
]

async function main() {
  for (const u of USERS) {
    // 1. Create Supabase Auth user (service role bypasses email confirmation)
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { role: u.role },
    })

    if (error && !error.message.includes('already been registered')) {
      console.error(`❌ ${u.email}: ${error.message}`)
      continue
    }

    const supabaseId = data?.user?.id

    if (!supabaseId) {
      // User already exists — fetch by email
      const { data: list } = await supabase.auth.admin.listUsers()
      const existing = list?.users.find(usr => usr.email === u.email)
      if (!existing) { console.error(`❌ ${u.email}: cannot find existing user`); continue }
      await upsertDbUser(existing.id, u.email, u.role)
    } else {
      await upsertDbUser(supabaseId, u.email, u.role)
    }
  }

  console.log('\n✓ Done. Credentials:')
  for (const u of USERS) {
    console.log(`  ${u.role.padEnd(10)} ${u.email}  /  ${u.password}`)
  }
}

async function upsertDbUser(supabaseId: string, email: string, role: string) {
  await prisma.user.upsert({
    where: { supabase_id: supabaseId },
    update: { role, is_active: true },
    create: { supabase_id: supabaseId, email, role, is_active: true },
  })
  console.log(`✓ ${role.padEnd(10)} ${email}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
