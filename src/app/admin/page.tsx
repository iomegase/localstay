import Link from 'next/link'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getAdminOverview } from '@/features/admin/queries/dashboard'
import { AdminQrScansChart } from '@/features/admin/components/AdminQrScansChart'
import { Building2, MapPin, BadgeCheck, Store, ShieldAlert, QrCode, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export default async function AdminOverviewPage() {
  await getPageAdmin()
  const overview = await getAdminOverview()

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* Carte de bienvenue / Titre */}
      <div className="mb-8 flex items-center justify-between rounded-[25px] border border-gray-50 bg-white p-8 shadow-sm">
        <div className="max-w-xl flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Vue globale</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">Cockpit Super-Admin</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
            Vue consultative MVP 2 : volumes, blocages Merchant et activité QR globale.
          </p>
          <button className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#111A2C] px-6 text-sm font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]">
            View Details
          </button>
        </div>
        {/* Emplacement pour une illustration similaire au screenshot */}
        <div className="hidden h-40 w-40 items-center justify-center rounded-[20px] bg-gray-50 md:flex">
            <span className="text-xs text-gray-400">Illustration</span>
        </div>
      </div>

      {/* Grille des KPIs et sections principales */}
      <div className="grid gap-6 xl:grid-cols-12">
        {/* KPIs (6 cartes) */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:col-span-8">
          <MetricCard title="Villes actives" value={overview.kpis.active_cities} icon={Building2} />
          <MetricCard title="POI actifs" value={overview.kpis.active_pois} icon={MapPin} />
          <MetricCard title="Owners actifs" value={overview.kpis.active_owners} icon={BadgeCheck} />
          <MetricCard title="Merchants actifs" value={overview.kpis.active_merchants} icon={Store} />
          <MetricCard title="Revendications" value={overview.kpis.pending_claims} icon={ShieldAlert} />
          <MetricCard title="Scans QR 30j" value={overview.kpis.qr_scans_30d} icon={QrCode} />
        </div>

        {/* Graphique et Actions */}
        <div className="flex flex-col rounded-[25px] border border-gray-50 bg-white p-6 shadow-sm xl:col-span-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-neutral-900">Analytics</h3>
            <div className="flex gap-1 rounded-lg border border-gray-100 bg-gray-50 p-1 text-xs font-medium">
              <button className="rounded-md bg-[#111A2C] px-3 py-1 text-white shadow-sm">Weekly</button>
              <button className="px-3 py-1 text-gray-500 transition-colors hover:text-gray-900">Monthly</button>
            </div>
          </div>
          
          <div className="min-h-[180px] flex-1">
            <AdminQrScansChart series={overview.qr_scans_series} />
          </div>
          
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-6">
            <Link href="/admin/pois" className="flex flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
              Gérer les POI
            </Link>
            <Link href="/admin/poi-acquisition" className="group flex flex-1 items-center justify-center rounded-xl bg-[#111A2C] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.02]">
              Acquisition <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Tableau et section Facturation */}
      <div className="mt-6 grid gap-6 xl:grid-cols-12">
        <div className="overflow-hidden rounded-[25px] border border-gray-50 bg-white shadow-sm xl:col-span-8">
          <div className="flex flex-row items-center justify-between border-b border-gray-100 p-6">
            <h3 className="text-base font-bold text-gray-900">Dernières revendications pending</h3>
            <Link href="/admin/merchant-claims" className="text-sm font-semibold text-gray-400 transition-colors hover:text-gray-900">
              View All
            </Link>
          </div>
          <div className="p-0 sm:p-6 sm:pt-0">
            {overview.latest_pending_claims.length === 0 ? (
              <div className="m-6 mt-0 flex h-32 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 sm:m-0">
                <p className="text-sm text-gray-500">Aucune revendication en attente.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="hidden text-gray-400 sm:table-header-group">
                    <tr>
                      <th className="px-4 pb-3 pt-4 text-[11px] font-semibold tracking-widest uppercase">Merchant</th>
                      <th className="px-4 pb-3 pt-4 text-[11px] font-semibold tracking-widest uppercase">POI</th>
                      <th className="px-4 pb-3 pt-4 text-[11px] font-semibold tracking-widest uppercase">Ville</th>
                      <th className="px-4 pb-3 pt-4 text-[11px] font-semibold tracking-widest uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {overview.latest_pending_claims.map((claim) => (
                      <tr key={claim.id} className="flex flex-col border-b border-gray-50 px-4 py-4 transition-colors hover:bg-gray-50/50 sm:table-row sm:border-0 sm:px-0 sm:py-0 last:border-0">
                        <td className="font-semibold text-neutral-900 sm:px-4 sm:py-4">{claim.merchant_email}</td>
                        <td className="text-[13px] text-gray-600 sm:px-4 sm:py-4 sm:text-sm">{claim.poi_name}</td>
                        <td className="mt-2 sm:mt-0 sm:px-4 sm:py-4">
                          <span className="inline-flex items-center rounded-lg bg-gray-100/80 px-2.5 py-1 text-xs font-semibold text-gray-600">
                            {claim.city_name}
                          </span>
                        </td>
                        <td className="mt-2 text-xs text-gray-400 sm:mt-0 sm:px-4 sm:py-4 sm:text-sm">
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

        {/* Section Facturation */}
        <div className="flex flex-col justify-between rounded-[25px] border border-gray-50 bg-white p-6 shadow-sm xl:col-span-4">
          <div>
            <h3 className="mb-2 text-xs font-semibold tracking-widest text-gray-400 uppercase">Billing</h3>
            <p className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">
              {overview.billing_notice}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-gray-500">
              Aucun revenu réel, Checkout Stripe ou Customer Portal n&apos;est exposé dans ce cockpit MVP 2.
            </p>
          </div>
          <button className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#111A2C] px-6 text-sm font-medium text-white shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]">
            Purchase Now
          </button>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon: Icon }: { title: string; value: number | string; icon: LucideIcon }) {
  return (
    <div className="group flex items-center gap-5 rounded-[20px] border border-gray-50 bg-white p-6 shadow-sm transition-all hover:border-gray-100 hover:shadow-md">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#F3F4F8] text-[#111A2C] transition-transform duration-300 group-hover:scale-110">
        <Icon size={24} strokeWidth={2} />
      </div>
      <div>
        <h3 className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">{title}</h3>
        <p className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">
          {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
        </p>
      </div>
    </div>
  )
}
