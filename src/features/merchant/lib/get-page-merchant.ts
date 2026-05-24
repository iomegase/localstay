import { redirect } from 'next/navigation'
import { createSupabasePageClient } from '@/shared/lib/supabase'
import { prisma } from '@/shared/lib/prisma'
import { getMerchantRedirect } from './redirect'

export async function getPageMerchant() {
  const supabase = await createSupabasePageClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const dbUser = await prisma.user.findFirst({
    where: { supabase_id: user.id, deleted_at: null, is_active: true },
    include: {
      merchant_profile: true,
      merchant_claims: {
        where: { deleted_at: null },
        orderBy: { created_at: 'desc' },
        take: 1,
      },
    },
  })

  if (!dbUser || dbUser.role !== 'merchant') redirect('/auth/login')

  return {
    merchant: dbUser,
    redirect_to: getMerchantRedirect(dbUser),
  }
}
