import Link from 'next/link'
import { Filter, Plus, Radar, Image as ImageIcon, CheckCircle2, XCircle, Trash2, MapPin, Search, Store } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getAdminPoiOptions, listAdminPois } from '@/features/admin-pois/queries/admin-pois'
import { AdminPoiStatusActions } from '@/features/admin-pois/components/AdminPoiStatusActions'
import { Badge } from '@/shared/components/ui/badge'
import type { AdminPoiListFilters } from '@/features/admin-pois/types'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const STATUS_STYLES: Record<string, string> = {
  current: 'bg-emerald-50/80 text-emerald-600 border-emerald-100/50',
  active: 'bg-emerald-50/80 text-emerald-600 border-emerald-100/50',
  inactive: 'bg-gray-100/80 text-gray-500 border-gray-200/50',
  archived: 'bg-amber-50 text-amber-600 border-amber-100/50',
}

const PRESERVED_FILTER_KEYS = [
  'subcategory_id',
  'geocode_status',
  'photo_status',
  'review_source',
  'page',
  'limit',
] as const

export default async function AdminPoisPage({ searchParams }: PageProps) {
  await getPageAdmin()
  const params = await searchParams
  const options = await getAdminPoiOptions()
  const selectedCityId = firstParam(params.city_id) ?? options.cities[0]?.id ?? null

  const filters = selectedCityId ? buildFilters(selectedCityId, params) : null
  const response = filters ? await listAdminPois(filters) : null

  return (
    <div className="w-full animate-in fade-in duration-500 space-y-6">
      
      {/* Header Section */}
      <header className="flex flex-col justify-between gap-6 rounded-[25px] border border-gray-50 bg-white p-8 shadow-sm md:flex-row md:items-center">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
            Catalogue public
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">
            Backoffice POI
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Gestion opérationnelle des POI publiés par ville : édition, photos, statut public, acquisition et effacement logique.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link 
            href={selectedCityId ? `/admin/poi-acquisition?city_id=${selectedCityId}` : '/admin/poi-acquisition'}
            className="group flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F4F7FE] px-5 text-[13px] font-bold text-[#0B1437] transition-all hover:bg-[#e4e9f7]"
          >
            <Radar size={16} className="transition-transform duration-300 group-hover:rotate-12" />
            Acquisition
          </Link>
          <Link 
            href={selectedCityId ? `/admin/pois/new?city_id=${selectedCityId}` : '/admin/pois/new'}
            className="group flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0B1437] px-6 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-gray-900 hover:shadow-md"
          >
            <Plus size={16} className="transition-transform duration-300 group-hover:scale-110" />
            Créer POI
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="space-y-6">
        
        {/* Filter Form */}
        <form action="/admin/pois" className="rounded-[25px] border border-gray-50 bg-white p-6 shadow-sm">
          {preservedFilterParams(params).map(({ key, name, value }) => (
            <input key={key} type="hidden" name={name} value={value} />
          ))}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
            
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="city_id" className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">Ville</label>
              <div className="relative">
                <select
                  id="city_id"
                  name="city_id"
                  defaultValue={selectedCityId ?? ''}
                  className="w-full h-[48px] appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-neutral-900 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]"
                  required
                >
                  {options.cities.map(city => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                  <ChevronDownIcon />
                </div>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="q" className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">Recherche</label>
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  id="q" 
                  name="q" 
                  defaultValue={firstParam(params.q) ?? ''} 
                  placeholder="Nom du POI..."
                  className="w-full h-[48px] rounded-xl border border-gray-100 bg-gray-50/50 pl-11 pr-4 text-sm font-medium text-neutral-900 placeholder-gray-400 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]" 
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="category_id" className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">Catégorie</label>
              <div className="relative">
                <select
                  id="category_id"
                  name="category_id"
                  defaultValue={firstParam(params.category_id) ?? ''}
                  className="w-full h-[48px] appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-neutral-900 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]"
                >
                  <option value="">Toutes catégories</option>
                  {options.categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                  <ChevronDownIcon />
                </div>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="status" className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">Statut</label>
              <div className="relative">
                <select
                  id="status"
                  name="status"
                  defaultValue={firstParam(params.status) ?? 'current'}
                  className="w-full h-[48px] appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-neutral-900 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]"
                >
                  <option value="current">Courants</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                  <option value="archived">Effacés</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                  <ChevronDownIcon />
                </div>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="discovery_status" className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">Découverte</label>
              <div className="relative">
                <select
                  id="discovery_status"
                  name="discovery_status"
                  defaultValue={firstParam(params.discovery_status) ?? ''}
                  className="w-full h-[48px] appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-neutral-900 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]"
                >
                  <option value="">Tous</option>
                  <option value="DRAFT">Brouillons</option>
                  <option value="PUBLISHED">Publiés</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                  <ChevronDownIcon />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <button 
                type="submit" 
                className="flex h-[48px] w-full items-center justify-center rounded-xl bg-[#0B1437] text-white transition-all hover:bg-gray-900 hover:shadow-md"
                title="Filtrer"
              >
                <Filter size={18} />
              </button>
            </div>
            
          </div>
        </form>

        {/* Dynamic Content */}
        {response && (
          <>
            {/* KPI Section */}
            <section className="grid grid-cols-2 gap-4 md:grid-cols-5 xl:gap-6">
              <MetricCard title="Actifs" value={response.kpis.active_count} icon={CheckCircle2} iconColor="text-emerald-500" />
              <MetricCard title="Inactifs" value={response.kpis.inactive_count} icon={XCircle} iconColor="text-rose-500" />
              <MetricCard title="Effacés" value={response.kpis.archived_count} icon={Trash2} iconColor="text-amber-500" />
              <MetricCard title="Sans photos" value={response.kpis.without_photos_count} icon={ImageIcon} iconColor="text-gray-500" />
              <MetricCard title="Géocodage" value={response.kpis.pending_geocode_count} icon={MapPin} iconColor="text-indigo-500" />
            </section>

            {/* Main Layout: Stacked vertically */}
            <section className="flex flex-col gap-6">
              
              {/* POI Table (Reduced Font Sizes) */}
              <div className="rounded-[25px] border border-gray-50 bg-white shadow-sm w-full">
                <div className="border-b border-gray-100 p-6">
                  <h2 className="text-base font-bold text-neutral-900">POI de la ville</h2>
                </div>
                
                {response.data.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
                      <Store size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900">Aucun POI publié</h3>
                    <p className="mt-2 text-sm text-gray-500">Lancez une acquisition ou créez une fiche manuelle.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead className="bg-white border-b border-gray-100">
                        <tr>
                          {/* Font sizes set to text-[10px] for headers */}
                          <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">POI</th>
                          <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Catégorie</th>
                          <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Statut</th>
                          <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 text-center">Photos</th>
                          <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50/80 bg-white">
                        {response.data.map(poi => (
                          <tr key={poi.id} className="group transition-colors duration-200 hover:bg-gray-50/50">
                            
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                {poi.primary_photo_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element -- URLs distantes non allowlistées par la spec 022.
                                  <img 
                                    src={poi.primary_photo_url} 
                                    alt="" 
                                    className="h-8 w-12 shrink-0 rounded-md object-cover border border-gray-100 shadow-sm" 
                                  />
                                ) : (
                                  <div className="flex h-8 w-12 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-400">
                                    <ImageIcon size={14} strokeWidth={1.5} />
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  {/* Reduced text sizes: 14px -> 13px, 12px -> 11px */}
                                  <span className="text-[13px] font-bold text-neutral-900 max-w-[200px] truncate">{poi.name}</span>
                                  {poi.public_url && (
                                    <Link
                                      href={poi.public_url}
                                      className="text-[11px] font-semibold text-gray-400 transition-colors hover:text-[#0B1437]"
                                    >
                                      Voir la page publique
                                    </Link>
                                  )}
                                  {poi.photos_status === 'needs_refresh' && (
                                    <span className="mt-1 inline-flex w-fit items-center rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
                                      Photos à rafraîchir
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-3">
                              <span className="text-[13px] font-bold text-neutral-900">{poi.category.name}</span>
                              {poi.subcategory && <span className="block text-[11px] font-semibold text-gray-400">{poi.subcategory.name}</span>}
                            </td>

                            <td className="px-5 py-3">
                              <div className="flex flex-col items-start gap-1">
                                <StatusBadge status={poi.status} />
                                <DiscoveryBadge name={poi.name} status={poi.discovery_status} />
                                {poi.merchant_attached && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">Merchant Lié</span>
                                )}
                              </div>
                            </td>

                            <td className="px-5 py-3 text-center">
                              <div className="flex items-center justify-center">
                                <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${poi.photo_count > 0 ? "bg-emerald-50/50 text-emerald-600" : "bg-gray-50 text-gray-400"}`}>
                                  <ImageIcon size={12} />
                                  <span className="text-[12px] font-bold">{poi.photo_count}</span>
                                </span>
                              </div>
                            </td>

                            <td className="px-5 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* Composant côté client intact */}
                                <AdminPoiStatusActions
                                  poiId={poi.id}
                                  status={poi.status}
                                  merchantAttached={poi.merchant_attached}
                                />
                                <Link 
                                  href={`/admin/pois/${poi.id}`}
                                  className="inline-flex h-[32px] items-center justify-center rounded-lg bg-[#F4F7FE] px-3 text-[12px] font-bold text-[#0B1437] transition-all hover:bg-[#0B1437] hover:text-white"
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

              {/* Aside: Runs Acquisition (Moved below, displayed as a Grid) */}
              <div className="w-full rounded-[25px] border border-gray-50 bg-white p-6 shadow-sm">
                <h2 className="text-base font-bold text-neutral-900 mb-6">Derniers Runs d&apos;acquisition</h2>
                
                {response.acquisition_runs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center text-sm font-medium text-gray-500">
                    Aucun run récent pour cette ville.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {response.acquisition_runs.map(run => (
                      <div 
                        key={run.id} 
                        className="group overflow-hidden rounded-[20px] border border-gray-50 bg-white shadow-sm transition-all duration-300 hover:border-gray-100 hover:shadow-md"
                      >
                        <div className="border-b border-gray-50 bg-[#F4F7FE]/30 px-4 py-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-bold text-neutral-900 truncate pr-2">{run.category_name}</span>
                            <span className="rounded-lg border border-gray-100 bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-gray-500 shrink-0">
                              {run.status}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between text-center">
                            <div>
                               <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Scan</p>
                               <p className="mt-1 text-[15px] font-bold text-neutral-900">{run.candidate_count}</p>
                            </div>
                            <div className="h-6 w-px bg-gray-100" />
                            <div>
                               <p className="text-[9px] font-bold uppercase tracking-widest text-amber-500">Revue</p>
                               <p className="mt-1 text-[15px] font-bold text-neutral-900">{run.needs_review_count}</p>
                            </div>
                            <div className="h-6 w-px bg-gray-100" />
                            <div>
                               <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">Publié</p>
                               <p className="mt-1 text-[15px] font-bold text-neutral-900">{run.published_count}</p>
                            </div>
                          </div>
                          
                          <Link 
                            href={`/admin/poi-acquisition/runs/${run.id}`}
                            className="mt-5 flex h-10 w-full items-center justify-center rounded-xl bg-[#F4F7FE] px-4 text-[12px] font-bold text-[#0B1437] transition-colors hover:bg-[#0B1437] hover:text-white"
                          >
                            Ouvrir le run
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
            </section>
          </>
        )}
      </div>
    </div>
  )
}

/* Helper Components */

function MetricCard({ title, value, icon: Icon, iconColor }: { title: string; value: number; icon: LucideIcon; iconColor: string }) {
  return (
    <div className="flex items-center gap-4 rounded-[20px] border border-gray-50 bg-white p-5 shadow-sm transition-colors hover:border-gray-100">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-50">
        <Icon size={20} className={iconColor} strokeWidth={2.5} />
      </div>
      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{title}</h3>
        <p className="mt-0.5 text-2xl font-bold tracking-tight text-neutral-900">
          {value}
        </p>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status.toLowerCase()] || 'bg-gray-100/80 text-gray-500 border-gray-200/50'
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${style}`}>
      {status}
    </span>
  )
}

function DiscoveryBadge({ name, status }: { name: string; status: 'DRAFT' | 'PUBLISHED' }) {
  const label = status === 'PUBLISHED' ? 'Publié' : 'Brouillon'
  return (
    <Badge
      variant="outline"
      aria-label={`${name} — Découverte : ${label}`}
      className={status === 'PUBLISHED'
        ? 'border-emerald-200 bg-emerald-50 text-[9px] uppercase tracking-wider text-emerald-700'
        : 'border-slate-200 bg-slate-50 text-[9px] uppercase tracking-wider text-slate-600'}
    >
      {label}
    </Badge>
  )
}

function ChevronDownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
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
    discovery_status: parseDiscoveryStatus(firstParam(params.discovery_status)),
    page: Number(firstParam(params.page) ?? 1),
    limit: Number(firstParam(params.limit) ?? 25),
  }
}

function firstParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  return raw && raw.length > 0 ? raw : undefined
}

function preservedFilterParams(params: Record<string, string | string[] | undefined>) {
  return PRESERVED_FILTER_KEYS.flatMap(name => {
    const values = Array.isArray(params[name]) ? params[name] : [params[name]]
    return values.flatMap((value, index) => value
      ? [{ key: `${name}-${index}`, name, value }]
      : [])
  })
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

function parseDiscoveryStatus(value: string | undefined): AdminPoiListFilters['discovery_status'] {
  if (value === 'DRAFT' || value === 'PUBLISHED') return value
  return undefined
}
