import { getOverviewMetrics } from '@/features/dashboard-owner/queries/overview'
import { getPageOwner } from '@/features/dashboard-owner/lib/get-page-owner'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { Building2, QrCode, TrendingUp, MapPin } from 'lucide-react'
import { OverviewChart } from '@/features/dashboard-owner/components/OverviewChart'
import type { OverviewMetrics } from '@/features/dashboard-owner/queries/overview'
import type { ReactNode } from 'react'

type ZoneMetricSet = OverviewMetrics['top_categories']

export default async function DashboardPage() {
  const dbUser = await getPageOwner()
  const metrics = await getOverviewMetrics(dbUser.id)

  if (metrics.lodging_count === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
        <h1 className="font-serif italic text-2xl text-foreground mb-2">Bienvenue sur MyStay</h1>
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

        <ZoneMetricCard
          title="Top catégorie"
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          metrics={metrics.top_categories}
        />

        <ZoneMetricCard
          title="Top POI"
          icon={<MapPin className="w-3.5 h-3.5" />}
          metrics={metrics.top_pois}
        />
      </div>

      <OverviewChart />
    </div>
  )
}

function ZoneMetricCard({
  title,
  icon,
  metrics,
}: {
  title: string
  icon: ReactNode
  metrics: ZoneMetricSet
}) {
  const primary = metrics.primary[0]
  const nearby = metrics.nearby[0]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {primary ? (
          <div>
            <p className="text-sm font-semibold truncate">{primary.name}</p>
            <p className="text-xs text-muted-foreground">Zone primaire · {primary.clicks} clics</p>
          </div>
        ) : (
          <p className="text-sm font-semibold">—</p>
        )}
        {nearby && (
          <div className="border-t pt-2">
            <p className="text-xs text-muted-foreground">Aux alentours</p>
            <p className="text-sm font-semibold truncate">{nearby.name}</p>
            <p className="text-xs text-muted-foreground">{nearby.clicks} clics</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
