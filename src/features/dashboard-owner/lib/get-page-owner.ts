import { redirect } from 'next/navigation'
import { prisma } from '@/shared/lib/prisma'
import { createSupabasePageClient } from '@/shared/lib/supabase'
import type { User } from '@prisma/client'

export async function getPageOwner(): Promise<User> {
  const supabase = await createSupabasePageClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const dbUser = await prisma.user.findFirst({
    where: { supabase_id: user.id, deleted_at: null, is_active: true },
  })

  if (!dbUser || dbUser.role !== 'owner') redirect('/auth/login')

  return dbUser
}
