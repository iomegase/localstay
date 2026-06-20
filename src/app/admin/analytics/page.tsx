import { Activity, BarChart3, LineChart, Search, TimerReset, Waves } from 'lucide-react'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import {
  getAdminAnalyticsLiveBlock,
  getAdminAnalyticsOverview,
  getAdminAnalyticsPerformance,
  getAdminAnalyticsSourceStatuses,
  listAdminAnalyticsCities,
  listAdminAnalyticsPages,
  listAdminAnalyticsQueries,
} from '@/features/admin-analytics/queries/dashboard'
import type {
  AdminAnalyticsLiveBlock,
  AdminAnalyticsSourceStatus,
  AnalyticsSourceKind,
} from '@/features/admin-analytics/types'

const SOURCE_LABELS: Record<AnalyticsSourceKind, string> = {
  ga4: 'Google Analytics 4',
  gsc: 'Google Search Console',
  vercel_analytics: 'Vercel Analytics',
  vercel_speed_insights: 'Vercel Speed Insights',
}

const STATUS_LABELS = {
  connected: 'Connectée',
  not_configured: 'Non configurée',
  failed: 'Échec',
  stale: 'Périmée',
  partial: 'Partielle',
  no_data: 'Sans données',
} as const

export default async function AdminAnalyticsPage() {
  await getPageAdmin()

  const [overview, sources, live, pages, queries, cities, performance] = await Promise.all([
    getAdminAnalyticsOverview(),
    getAdminAnalyticsSourceStatuses(),
    getAdminAnalyticsLiveBlock(),
    listAdminAnalyticsPages(),
    listAdminAnalyticsQueries(),
    listAdminAnalyticsCities(),
    getAdminAnalyticsPerformance(),
  ])

  return (
    <div className="space-y-6">
      <section className="rounded-[25px] border border-gray-50 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          Analytics SEO/GEO
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">
          Analytics SEO/GEO
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-500">
          Cockpit consolidé acquisition, engagement, conversion et performance pour les pages publiques StayLocal.
        </p>
        <p className="mt-4 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          Période: {overview.period.date_from} au {overview.period.date_to}
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {sources.map(source => (
          <SourceStatusCard key={source.source} source={source} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <MetricCard title="Impressions SEO" value={overview.acquisition_kpis.seo_impressions} icon={Search} />
        <MetricCard title="Clics SEO" value={overview.acquisition_kpis.seo_clicks} icon={Activity} />
        <MetricCard title="CTR SEO" value={formatPercent(overview.acquisition_kpis.seo_ctr)} icon={LineChart} />
        <MetricCard title="Position moyenne" value={formatDecimal(overview.acquisition_kpis.seo_avg_position)} icon={TimerReset} />
        <MetricCard title="Landing pages actives" value={overview.acquisition_kpis.active_landing_pages} icon={BarChart3} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Sessions" value={overview.engagement_kpis.sessions} icon={Activity} />
        <MetricCard title="Users" value={overview.engagement_kpis.users} icon={LineChart} />
        <MetricCard title="Page views" value={overview.engagement_kpis.page_views} icon={BarChart3} />
        <MetricCard title="Engagement rate" value={formatPercent(overview.engagement_kpis.engagement_rate)} icon={Waves} />
        <MetricCard title="Contact leads" value={overview.engagement_kpis.contact_leads} icon={Search} />
        <MetricCard title="Clics contact logement" value={overview.engagement_kpis.lodging_contact_clicks} icon={Activity} />
        <MetricCard title="Clics réservation externe" value={overview.engagement_kpis.external_booking_clicks} icon={LineChart} />
        <MetricCard title="QR scans" value={overview.engagement_kpis.qr_scans} icon={BarChart3} />
      </section>

      <section className="rounded-[25px] border border-gray-50 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900">Live</h2>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {STATUS_LABELS[live.status]}
          </span>
        </div>
        <LiveBlock live={live} />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <SimpleTable
          title="Pages"
          columns={['Page', 'Type', 'Ville', 'Sessions', 'Clics SEO', 'Conversions']}
          rows={pages.map(row => [
            row.page_path,
            row.page_type,
            row.city_name ?? 'Global',
            formatNumber(row.sessions),
            formatNumber(row.seo_clicks),
            formatNumber(row.conversions),
          ])}
        />
        <SimpleTable
          title="Requêtes"
          columns={['Requête', 'Page', 'Ville', 'Clics', 'Impressions', 'Position']}
          rows={queries.map(row => [
            row.query,
            row.page_path ?? 'Global',
            row.city_name ?? 'Global',
            formatNumber(row.clicks),
            formatNumber(row.impressions),
            formatDecimal(row.avg_position),
          ])}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SimpleTable
          title="Villes"
          columns={['Ville', 'Sessions', 'Clics SEO', 'Conversions', 'Top page']}
          rows={cities.map(row => [
            row.city_name,
            formatNumber(row.sessions),
            formatNumber(row.seo_clicks),
            formatNumber(row.conversions),
            row.top_page_path ?? 'Aucune',
          ])}
        />
        <SimpleTable
          title="Core Web Vitals"
          columns={['Page', 'Ville', 'Pass rate', 'LCP', 'INP', 'CLS']}
          rows={performance.rows.map(row => [
            row.page_path ?? 'Global',
            row.city_name ?? 'Global',
            formatPercent(row.core_web_vitals_pass_rate),
            formatDecimal(row.lcp),
            formatDecimal(row.inp),
            formatDecimal(row.cls),
          ])}
          emptyMessage={`Core Web Vitals: ${STATUS_LABELS[performance.status]}`}
        />
      </div>
    </div>
  )
}

function SourceStatusCard({ source }: { source: AdminAnalyticsSourceStatus }) {
  return (
    <article className="rounded-[20px] border border-gray-50 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
        Source
      </p>
      <h2 className="mt-2 text-base font-bold text-neutral-900">
        {SOURCE_LABELS[source.source]}
      </h2>
      <p className="mt-3 text-sm font-medium text-gray-700">
        {STATUS_LABELS[source.status]}
      </p>
      <p className="mt-2 text-xs text-gray-500">
        Dernier succès: {source.last_success_at ?? 'Aucun'}
      </p>
      {source.error_message ? (
        <p className="mt-2 text-xs text-amber-700">{source.error_message}</p>
      ) : null}
    </article>
  )
}

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string
  value: number | string
  icon: typeof Activity
}) {
  return (
    <article className="rounded-[20px] border border-gray-50 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4F7FE] text-[#0B1437]">
          <Icon size={20} />
        </div>
      </div>
    </article>
  )
}

function LiveBlock({ live }: { live: AdminAnalyticsLiveBlock }) {
  if (live.status !== 'connected') {
    return (
      <p className="text-sm text-gray-500">
        Live indisponible
      </p>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Visiteurs</p>
        <p className="mt-2 text-2xl font-bold text-neutral-900">{formatNumber(live.visitors)}</p>
      </div>
      <div className="rounded-2xl bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Page views</p>
        <p className="mt-2 text-2xl font-bold text-neutral-900">{formatNumber(live.page_views)}</p>
      </div>
    </div>
  )
}

function SimpleTable({
  title,
  columns,
  rows,
  emptyMessage = 'Aucune donnée disponible.',
}: {
  title: string
  columns: string[]
  rows: string[][]
  emptyMessage?: string
}) {
  return (
    <section className="overflow-hidden rounded-[25px] border border-gray-50 bg-white shadow-sm">
      <div className="border-b border-gray-100 p-6">
        <h2 className="text-base font-bold text-neutral-900">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <div className="p-6 text-sm text-gray-500">{emptyMessage}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {columns.map(column => (
                  <th key={column} className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${title}-${index}`} className="border-b border-gray-50 last:border-0">
                  {row.map((cell, cellIndex) => (
                    <td key={`${title}-${index}-${cellIndex}`} className="px-6 py-4 text-gray-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function formatNumber(value: number | null): string {
  return value === null ? 'N/A' : value.toLocaleString('fr-FR')
}

function formatPercent(value: number | null): string {
  return value === null ? 'N/A' : `${(value * 100).toFixed(1)} %`
}

function formatDecimal(value: number | null): string {
  return value === null ? 'N/A' : value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
}
