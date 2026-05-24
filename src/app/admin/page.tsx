import Link from 'next/link'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getAdminOverview } from '@/features/admin/queries/dashboard'
import { AdminQrScansChart } from '@/features/admin/components/AdminQrScansChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'

export default async function AdminOverviewPage() {
  await getPageAdmin()
  const overview = await getAdminOverview()

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">Vue globale</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Cockpit Super-Admin</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          Vue consultative MVP 2 : volumes, blocages Merchant et activité QR globale.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard title="Villes actives" value={overview.kpis.active_cities} />
        <MetricCard title="POI actifs" value={overview.kpis.active_pois} />
        <MetricCard title="Owners actifs" value={overview.kpis.active_owners} />
        <MetricCard title="Merchants actifs" value={overview.kpis.active_merchants} />
        <MetricCard title="Revendications pending" value={overview.kpis.pending_claims} />
        <MetricCard title="Scans QR 30j" value={overview.kpis.qr_scans_30d} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <AdminQrScansChart series={overview.qr_scans_series} />

        <Card className="border-amber-200/40 bg-amber-50 text-slate-950">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Facturation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{overview.billing_notice}</p>
            <p className="mt-2 text-sm text-slate-600">
              Aucun revenu réel, Checkout Stripe ou Customer Portal n&apos;est exposé dans ce cockpit MVP 2.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white text-slate-950">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dernières revendications pending</CardTitle>
          <Link href="/admin/merchant-claims" className="text-sm font-medium text-slate-600 underline">
            Voir toutes
          </Link>
        </CardHeader>
        <CardContent>
          {overview.latest_pending_claims.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune revendication en attente.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>POI</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.latest_pending_claims.map(claim => (
                  <TableRow key={claim.id}>
                    <TableCell>{claim.merchant_email}</TableCell>
                    <TableCell>{claim.poi_name}</TableCell>
                    <TableCell>{claim.city_name}</TableCell>
                    <TableCell>{new Date(claim.created_at).toLocaleDateString('fr-FR')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <Card className="border-white/10 bg-white/10 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-slate-300">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-3xl font-semibold">{value}</CardContent>
    </Card>
  )
}
