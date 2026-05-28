import Link from 'next/link'
import { Filter, Plus, Radar, Image as ImageIcon, CheckCircle2, XCircle, Trash2, MapPin, Search, Store } from 'lucide-react'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getAdminPoiOptions, listAdminPois } from '@/features/admin-pois/queries/admin-pois'
import { AdminPoiStatusActions } from '@/features/admin-pois/components/AdminPoiStatusActions'
import type { AdminPoiListFilters } from '@/features/admin-pois/types'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const STATUS_STYLES: Record<string, string> = {
  current: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  inactive: 'bg-slate-50 text-slate-600 border-slate-200',
  archived: 'bg-amber-50 text-amber-600 border-amber-200',
}

export default async function AdminPoisPage({ searchParams }: PageProps) {
  await getPageAdmin()
  const params = await searchParams
  const options = await getAdminPoiOptions()
  const selectedCityId = firstParam(params.city_id) ?? options.cities[0]?.id ?? null

  const filters = selectedCityId ? buildFilters(selectedCityId, params) : null
  const response = filters ? await listAdminPois(filters) : null

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Section */}
      <header className="flex flex-col gap-6 border-b border-slate-100 bg-white px-6 py-8 md:flex-row md:items-end md:justify-between md:px-10">
        <div className="group">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-500">Catalogue public</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 transition-colors md:text-4xl">
            Backoffice POI
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 max-w-2xl">
            Gestion opérationnelle des POI publiés par ville : édition, photos, statut public, acquisition et effacement logique.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link 
            href={selectedCityId ? `/admin/poi-acquisition?city_id=${selectedCityId}` : '/admin/poi-acquisition'}
            className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[14px] font-bold text-slate-700 shadow-sm transition-all duration-300 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
          >
            <Radar size={16} className="transition-transform duration-300 group-hover:scale-110" />
            Acquisition
          </Link>
          <Link 
            href={selectedCityId ? `/admin/pois/new?city_id=${selectedCityId}` : '/admin/pois/new'}
            className="group flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-[14px] font-bold text-white shadow-md shadow-indigo-200 transition-all duration-300 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-300 hover:-translate-y-0.5"
          >
            <Plus size={16} className="transition-transform duration-300 group-hover:scale-125" />
            Créer POI
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="space-y-8 px-6 py-8 md:px-10">
        
        {/* Filter Form */}
        <form action="/admin/pois" className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition-shadow duration-300 hover:shadow-md">
          <div className="flex flex-col gap-0 md:flex-row md:items-center">
            
            <div className="flex-1 border-b border-slate-100 p-4 md:border-b-0 md:border-r">
              <label htmlFor="city_id" className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Ville</label>
              <select
                id="city_id"
                name="city_id"
                defaultValue={selectedCityId ?? ''}
                className="w-full cursor-pointer appearance-none bg-transparent text-[15px] font-bold text-slate-800 outline-none"
                required
              >
                {options.cities.map(city => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>

            <div className="flex-[1.5] border-b border-slate-100 p-4 md:border-b-0 md:border-r">
              <label htmlFor="q" className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Recherche</label>
              <div className="flex items-center gap-2 text-slate-400 focus-within:text-indigo-500 transition-colors">
                <Search size={16} />
                <input 
                  id="q" 
                  name="q" 
                  defaultValue={firstParam(params.q) ?? ''} 
                  placeholder="Nom du POI..."
                  className="w-full bg-transparent text-[15px] font-medium text-slate-800 placeholder:text-slate-300 outline-none" 
                />
              </div>
            </div>

            <div className="flex-1 border-b border-slate-100 p-4 md:border-b-0 md:border-r">
              <label htmlFor="category_id" className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Catégorie</label>
              <select
                id="category_id"
                name="category_id"
                defaultValue={firstParam(params.category_id) ?? ''}
                className="w-full cursor-pointer appearance-none bg-transparent text-[15px] font-semibold text-slate-800 outline-none"
              >
                <option value="">Toutes catégories</option>
                {options.categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 p-4 md:pr-4">
              <label htmlFor="status" className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Statut</label>
              <select
                id="status"
                name="status"
                defaultValue={firstParam(params.status) ?? 'current'}
                className="w-full cursor-pointer appearance-none bg-transparent text-[15px] font-semibold text-slate-800 outline-none"
              >
                <option value="current">Courants</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
                <option value="archived">Effacés</option>
              </select>
            </div>

            <div className="p-4 md:px-4">
              <button 
                type="submit" 
                className="group flex h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-slate-50 px-6 font-bold text-slate-700 transition-all duration-300 hover:bg-indigo-50 hover:text-indigo-600"
              >
                <Filter size={16} className="transition-transform duration-300 group-hover:scale-110" />
                Filtrer
              </button>
            </div>
            
          </div>
        </form>

        {/* Dynamic Content */}
        {response && (
          <>
            {/* KPI Section */}
            <section className="grid grid-cols-2 gap-4 md:grid-cols-5 xl:gap-6">
              <MetricCard title="Actifs" value={response.kpis.active_count} icon={CheckCircle2} colorClass="bg-emerald-500" />
              <MetricCard title="Inactifs" value={response.kpis.inactive_count} icon={XCircle} colorClass="bg-red-400" />
              <MetricCard title="Effacés" value={response.kpis.archived_count} icon={Trash2} colorClass="bg-amber-400" />
              <MetricCard title="Sans photos" value={response.kpis.without_photos_count} icon={ImageIcon} colorClass="bg-slate-400" />
              <MetricCard title="Géocodage à revoir" value={response.kpis.pending_geocode_count} icon={MapPin} colorClass="bg-rose-500" />
            </section>

            {/* Layout Grid */}
            <section className="grid gap-8 grid-cols-1">
              
              {/* POI Table */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgb(0,0,0,0.02)] xl:overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/50 p-5 md:px-6">
                  <h2 className="text-[15px] font-bold text-slate-800">POI de la ville</h2>
                </div>
                
                {response.data.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                      <Store size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Aucun POI publié</h3>
                    <p className="mt-2 text-sm text-slate-500">Lancez une acquisition ou créez une fiche manuelle.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead className="border-b border-slate-100 bg-slate-50/80">
                        <tr>
                          <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">POI</th>
                          <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">Catégorie</th>
                          <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">Statut</th>
                          <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500 text-center">Atouts</th>
                          <th className="px-6 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 bg-white">
                        {response.data.map(poi => (
                          <tr key={poi.id} className="group transition-colors duration-300 hover:bg-slate-50/50">
                            
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                {poi.primary_photo_url ? (
                                  <img 
                                    src={poi.primary_photo_url} 
                                    alt="" 
                                    className="h-12 w-16 shrink-0 rounded-xl object-cover shadow-sm transition-transform duration-300 group-hover:scale-105" 
                                  />
                                ) : (
                                  <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                                    <ImageIcon size={20} strokeWidth={1.5} />
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <span className="text-[14px] font-bold text-slate-800 max-w-[200px] truncate">{poi.name}</span>
                                  <Link 
                                    href={poi.public_url} 
                                    className="mt-0.5 text-[12px] font-medium text-slate-400 transition-colors hover:text-indigo-600"
                                  >
                                    Voir page publique
                                  </Link>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <span className="text-[14px] font-semibold text-slate-700">{poi.category.name}</span>
                              {poi.subcategory && <span className="mt-0.5 block text-[12px] font-medium text-slate-400">{poi.subcategory.name}</span>}
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex flex-col items-start gap-1">
                                <StatusBadge status={poi.status} />
                                {poi.merchant_attached && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Merchant Lié</span>
                                )}
                              </div>
                            </td>

                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-3">
                                <span className="group flex items-center gap-1.5 tooltip-trigger">
                                  <ImageIcon size={14} className={poi.photo_count > 0 ? "text-emerald-500" : "text-slate-300"} />
                                  <span className="text-[13px] font-bold text-slate-600">{poi.photo_count}</span>
                                </span>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-right align-middle">
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                <AdminPoiStatusActions
                                  poiId={poi.id}
                                  status={poi.status}
                                  merchantAttached={poi.merchant_attached}
                                />
                                <Link 
                                  href={`/admin/pois/${poi.id}`}
                                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                                >
                                  Éditer
                                </Link>
                              </div>
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Aside: Runs Acquisition */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 h-fit shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                <h2 className="text-[15px] font-bold text-slate-800 mb-6">Runs d'acquisition</h2>
                
                <div className="space-y-4">
                  {response.acquisition_runs.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm font-medium text-slate-500">
                      Aucun run récent pour cette ville.
                    </div>
                  ) : (
                    response.acquisition_runs.map(run => (
                      <div 
                        key={run.id} 
                        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-indigo-200 hover:shadow-md"
                      >
                        <div className="border-b border-slate-50 bg-slate-50/50 px-4 py-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-bold text-slate-800">{run.category_name}</span>
                            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              {run.status}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between text-center">
                            <div>
                               <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scan</p>
                               <p className="mt-1 font-mono text-[14px] font-semibold text-slate-700">{run.candidate_count}</p>
                            </div>
                            <div className="h-6 w-px bg-slate-100" />
                            <div>
                               <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Revue</p>
                               <p className="mt-1 font-mono text-[14px] font-semibold text-slate-700">{run.needs_review_count}</p>
                            </div>
                            <div className="h-6 w-px bg-slate-100" />
                            <div>
                               <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Publié</p>
                               <p className="mt-1 font-mono text-[14px] font-semibold text-slate-700">{run.published_count}</p>
                            </div>
                          </div>
                          
                          <Link 
                            href={`/admin/poi-acquisition/runs/${run.id}`}
                            className="mt-4 flex w-full items-center justify-center rounded-xl bg-slate-50 px-4 py-2 text-[12px] font-bold text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            Ouvrir le run
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon: Icon, colorClass }: { title: string; value: number, icon: any, colorClass?: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all duration-300 hover:border-slate-300 hover:shadow-md">
      <div className={`absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-5 transition-transform duration-500 group-hover:scale-150 ${colorClass}`} />
      
      <div className="flex items-start justify-between">
        <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-400">{title}</h3>
        <Icon size={16} className={`opacity-80 transition-transform duration-300 group-hover:-translate-y-1 ${colorClass?.replace('bg-', 'text-')}`} />
      </div>
      <p className="mt-4 text-3xl font-black tracking-tight text-slate-800 transition-colors group-hover:text-indigo-950">
        {value}
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status.toLowerCase()] || 'bg-slate-50 text-slate-600 border-slate-200'
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 hover:shadow-sm ${style}`}>
      {status}
    </span>
  )
}

/* -------------------------------------------------------------------------
   Business Logic Extractors (Maintained Identical)
   ------------------------------------------------------------------------- */
   
function buildFilters(cityId: string, params: Record<string, string | string[] | undefined>): AdminPoiListFilters {
  return {
    city_id: cityId,
    q: firstParam(params.q),
    category_id: firstParam(params.category_id),
    subcategory_id: firstParam(params.subcategory_id),
    status: parseStatus(firstParam(params.status)),
    geocode_status: firstParam(params.geocode_status),
    photo_status: parsePhotoStatus(firstParam(params.photo_status)),
    review_source: parseReviewSource(firstParam(params.review_source)),
    page: Number(firstParam(params.page) ?? 1),
    limit: Number(firstParam(params.limit) ?? 25),
  }
}

function firstParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  return raw && raw.length > 0 ? raw : undefined
}

function parseStatus(value: string | undefined): AdminPoiListFilters['status'] {
  if (value === 'active' || value === 'inactive' || value === 'archived' || value === 'current') return value
  return 'current'
}

function parsePhotoStatus(value: string | undefined): AdminPoiListFilters['photo_status'] {
  if (value === 'with_photos' || value === 'without_photos') return value
  return undefined
}

function parseReviewSource(value: string | undefined): AdminPoiListFilters['review_source'] {
  if (value === 'MANUAL' || value === 'GOOGLE') return value
  return undefined
}