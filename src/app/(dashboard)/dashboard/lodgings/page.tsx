import { createSupabaseRouteClient } from '@/shared/lib/supabase'
import { prisma } from '@/shared/lib/prisma'
import { getLodgingsForOwner } from '@/features/dashboard-owner/queries/lodgings'
import { redirect } from 'next/navigation'
import { LodgingsTable } from '@/features/dashboard-owner/components/LodgingsTable'

export default async function LodgingsPage() {
  const supabase = await createSupabaseRouteClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const dbUser = await prisma.user.findFirst({
    where: { supabase_id: user.id, deleted_at: null },
  })
  if (!dbUser || dbUser.role !== 'owner') redirect('/auth/login')

  const lodgings = await getLodgingsForOwner(dbUser.id)

  const cities = await prisma.city.findMany({
    where: { is_active: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <h1 className="font-serif italic text-2xl text-foreground">Mes logements</h1>
      <LodgingsTable lodgings={lodgings} cities={cities} />
    </div>
  )
}
