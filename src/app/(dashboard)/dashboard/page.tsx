import { createSupabaseRouteClient } from '@/shared/lib/supabase'
import { prisma } from '@/shared/lib/prisma'
import { getOverviewMetrics } from '@/features/dashboard-owner/queries/overview'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { Building2, QrCode, TrendingUp, MapPin } from 'lucide-react'
import { OverviewChart } from '@/features/dashboard-owner/components/OverviewChart'

export default async function DashboardPage() {
  const supabase = await createSupabaseRouteClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const dbUser = await prisma.user.findFirst({
    where: { supabase_id: user.id, deleted_at: null },
  })
  if (!dbUser || dbUser.role !== 'owner') redirect('/auth/login')

  const metrics = await getOverviewMetrics(dbUser.id)

  if (metrics.lodging_count === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
        <h1 className="font-serif italic text-2xl text-foreground mb-2">Bienvenue sur StayLocal</h1>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Vous n&apos;avez pas encore de logement. Créez-en un pour commencer à partager votre guide local.
        </p>
        <Link
          href="/dashboard/lodgings"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Créer mon premier logement
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif italic text-2xl text-foreground">Tableau de bord</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Logements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.lodging_count}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5" /> Scans QR (7j)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.qr_scans_7d}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Top catégorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold truncate">
              {metrics.top_categories[0]?.name ?? '—'}
            </p>
            {metrics.top_categories[0] && (
              <p className="text-xs text-muted-foreground">{metrics.top_categories[0].clicks} clics</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Top POI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold truncate">
              {metrics.top_pois[0]?.name ?? '—'}
            </p>
            {metrics.top_pois[0] && (
              <p className="text-xs text-muted-foreground">{metrics.top_pois[0].clicks} clics</p>
            )}
          </CardContent>
        </Card>
      </div>

      <OverviewChart />
    </div>
  )
}
