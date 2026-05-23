import { createSupabaseRouteClient } from '@/shared/lib/supabase'
import { prisma } from '@/shared/lib/prisma'
import { redirect } from 'next/navigation'
import { getActiveLodgingQrCode } from '@/features/dashboard-owner/queries/qr-code'
import { QrCodeCard } from '@/features/dashboard-owner/components/QrCodeCard'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function LodgingQrCodePage({ params }: Props) {
  const { id } = await params

  const supabase = await createSupabaseRouteClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const dbUser = await prisma.user.findFirst({
    where: { supabase_id: user.id, deleted_at: null },
  })
  if (!dbUser || dbUser.role !== 'owner') redirect('/auth/login')

  const lodging = await prisma.lodging.findFirst({
    where: { id, owner_id: dbUser.id, deleted_at: null },
    select: { id: true, name: true },
  })
  if (!lodging) redirect('/dashboard/lodgings')

  const qr = await getActiveLodgingQrCode(id)

  const scanCount7d = await prisma.analytics.count({
    where: {
      lodging_id: id,
      event_type: 'qr_scan',
      created_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  })

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/lodgings"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Mes logements
        </Link>
      </div>

      <h1 className="font-serif italic text-2xl text-foreground">{lodging.name}</h1>

      <QrCodeCard
        lodgingId={id}
        qrCode={qr ? { ...qr, created_at: qr.created_at.toISOString() } : null}
        scanCount7d={scanCount7d}
      />
    </div>
  )
}
