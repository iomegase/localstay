import { prisma } from '@/shared/lib/prisma'
import { getLodgingsForOwner } from '@/features/dashboard-owner/queries/lodgings'
import { getPageOwner } from '@/features/dashboard-owner/lib/get-page-owner'
import { LodgingsTable } from '@/features/dashboard-owner/components/LodgingsTable'

export default async function LodgingsPage() {
  const dbUser = await getPageOwner()

  const [lodgings, cities] = await Promise.all([
    getLodgingsForOwner(dbUser.id),
    prisma.city.findMany({
      where: { is_active: true, deleted_at: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <h1 className="font-serif italic text-2xl text-foreground">Mes logements</h1>
      <LodgingsTable lodgings={lodgings} cities={cities} />
    </div>
  )
}
