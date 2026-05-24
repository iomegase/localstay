import { redirect } from 'next/navigation'
import { createSupabasePageClient } from '@/shared/lib/supabase'
import { prisma } from '@/shared/lib/prisma'

export async function getPageAdmin() {
  const supabase = await createSupabasePageClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const dbUser = await prisma.user.findFirst({
    where: { supabase_id: user.id, deleted_at: null, is_active: true },
  })

  if (!dbUser || dbUser.role !== 'admin') redirect('/auth/login')

  return dbUser
}
