import { redirect } from 'next/navigation'
import { getPageMerchant } from '@/features/merchant/lib/get-page-merchant'
import { getMerchantStats } from '@/features/merchant/queries/dashboard'
import { MerchantStatsChart } from '@/features/merchant/components/MerchantStatsChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'

export default async function MerchantStatsPage() {
  const { redirect_to, merchant } = await getPageMerchant()
  if (redirect_to !== '/merchant/dashboard') redirect(redirect_to)

  const stats = await getMerchantStats(merchant.id)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-600">Statistiques</p>
        <h1 className="mt-2 text-4xl text-charcoal">Visibilité 30 jours</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Vues fiche" value={stats.totals.profile_views} />
        <MetricCard title="Clics téléphone" value={stats.totals.phone_clicks} />
        <MetricCard title="Clics itinéraire" value={stats.totals.directions_clicks} />
        <MetricCard title="Clics site web" value={stats.totals.website_clicks} />
      </div>

      <MerchantStatsChart stats={stats} />
    </div>
  )
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-3xl font-semibold">{value}</CardContent>
    </Card>
  )
}
