import Link from 'next/link'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getAdminOverview } from '@/features/admin/queries/dashboard'
import { AdminQrScansChart } from '@/features/admin/components/AdminQrScansChart'
import { Building2, MapPin, BadgeCheck, Store, ShieldAlert, QrCode, ArrowRight } from 'lucide-react'

export default async function AdminOverviewPage() {
  await getPageAdmin()
  const overview = await getAdminOverview()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col justify-between gap-6 pb-2 lg:flex-row lg:items-end">
        <div className="group">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-500">
            Vue globale
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 transition-colors">
            Cockpit Super-Admin
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            Vue consultative MVP 2 : volumes, blocages Merchant et activité QR globale.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/pois"
            className="group flex h-10 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md border border-slate-200"
          >
            Gérer les POI par ville
          </Link>
          <Link
            href="/admin/poi-acquisition"
            className="group relative flex h-10 items-center justify-center overflow-hidden rounded-2xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-200"
          >
            <span className="relative z-10 flex items-center gap-2">
              Lancer acquisition
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard 
          title="Villes actives" 
          value={overview.kpis.active_cities} 
          icon={Building2} 
          colorClass="bg-blue-50 text-blue-600 border-blue-100/50" 
        />
        <MetricCard 
          title="POI actifs" 
          value={overview.kpis.active_pois} 
          icon={MapPin} 
          colorClass="bg-emerald-50 text-emerald-600 border-emerald-100/50" 
        />
        <MetricCard 
          title="Owners actifs" 
          value={overview.kpis.active_owners} 
          icon={BadgeCheck} 
          colorClass="bg-violet-50 text-violet-600 border-violet-100/50" 
        />
        <MetricCard 
          title="Merchants actifs" 
          value={overview.kpis.active_merchants} 
          icon={Store} 
          colorClass="bg-orange-50 text-orange-600 border-orange-100/50" 
        />
        <MetricCard 
          title="Revendications pending" 
          value={overview.kpis.pending_claims} 
          icon={ShieldAlert} 
          colorClass="bg-rose-50 text-rose-600 border-rose-100/50" 
        />
        <MetricCard 
          title="Scans QR 30j" 
          value={overview.kpis.qr_scans_30d} 
          icon={QrCode} 
          colorClass="bg-teal-50 text-teal-600 border-teal-100/50" 
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <AdminQrScansChart series={overview.qr_scans_series} />

        <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50/30 p-6 shadow-sm transition-all hover:shadow-md">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-400 opacity-20 blur-2xl transition-opacity group-hover:opacity-40"></div>
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
              Facturation
            </h3>
            <p className="mt-3 text-2xl font-bold tracking-tight text-amber-950">
              {overview.billing_notice}
            </p>
          </div>
          <p className="mt-6 text-sm leading-relaxed text-amber-800/70">
            Aucun revenu réel, Checkout Stripe ou Customer Portal n&apos;est exposé dans
            ce cockpit MVP 2.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-sm transition-shadow hover:shadow-md">
        <div className="flex flex-row items-center justify-between border-b border-slate-100/60 p-5 md:p-6">
          <h3 className="text-lg font-bold text-slate-800">
            Dernières revendications pending
          </h3>
          <Link href="/admin/merchant-claims" className="text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-700">
            Voir toutes
          </Link>
        </div>
        
        <div className="p-0 sm:p-6 sm:pt-0">
          {overview.latest_pending_claims.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 m-6 sm:m-0 mt-0">
              <p className="text-sm text-slate-500">Aucune revendication en attente.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 text-slate-500 hidden sm:table-header-group">
                  <tr>
                    <th className="px-4 py-3 font-semibold pb-3 text-[13px] tracking-wide">Merchant</th>
                    <th className="px-4 py-3 font-semibold pb-3 text-[13px] tracking-wide">POI</th>
                    <th className="px-4 py-3 font-semibold pb-3 text-[13px] tracking-wide">Ville</th>
                    <th className="px-4 py-3 font-semibold pb-3 text-[13px] tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60">
                  {overview.latest_pending_claims.map((claim) => (
                    <tr key={claim.id} className="group transition-colors hover:bg-slate-50/50 flex flex-col sm:table-row py-3 sm:py-0 px-4 sm:px-0 border-b border-slate-100 last:border-0 sm:border-0">
                      <td className="sm:px-4 sm:py-4 font-medium text-slate-700">
                        {claim.merchant_email}
                      </td>
                      <td className="sm:px-4 sm:py-4 text-slate-600 text-[13px] sm:text-sm">
                        {claim.poi_name}
                      </td>
                      <td className="sm:px-4 sm:py-4 mt-2 sm:mt-0">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          {claim.city_name}
                        </span>
                      </td>
                      <td className="sm:px-4 sm:py-4 text-slate-400 text-xs sm:text-sm sm:text-slate-500 mt-2 sm:mt-0">
                        {new Date(claim.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  colorClass 
}: { 
  title: string; 
  value: number|string; 
  icon: any; 
  colorClass: string; 
}) {
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-[20px] border border-slate-100 bg-white p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-slate-200">
      <div className="flex items-start justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 transition-colors group-hover:text-slate-700">
          {title}
        </h3>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${colorClass}`}>
          <Icon size={16} strokeWidth={2.5} />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-4xl font-bold tracking-tight text-slate-800">
          {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
        </span>
      </div>
    </div>
  )
}