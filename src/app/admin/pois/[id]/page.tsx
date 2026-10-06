import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, MapPin, Tag } from 'lucide-react'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getAdminPoi, getAdminPoiOptions } from '@/features/admin-pois/queries/admin-pois'
import { AdminPoiEditorBody } from '@/features/admin-pois/components/AdminPoiEditorBody'
import { AdminPoiStatusActions } from '@/features/admin-pois/components/AdminPoiStatusActions'
import { adminPoiListHref, firstParam, type SearchParamsRecord } from '@/features/admin-pois/lib/list-filters'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<SearchParamsRecord>
}

export default async function AdminPoiDetailPage({ params, searchParams }: PageProps) {
  await getPageAdmin()
  const { id } = await params
  const listParams = searchParams ? await searchParams : {}
  const [poi, options] = await Promise.all([
    getAdminPoi(id),
    getAdminPoiOptions(),
  ])

  if (!poi) notFound()

  // Spec 068 AC-02-03 : le retour conserve tous les filtres de la liste.
  const backHref = adminPoiListHref(firstParam(listParams.city_id) ? listParams : { ...listParams, city_id: poi.city.id })

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-50/30 min-h-screen pb-10">
      <header className="px-6 py-8 md:px-10 border-b border-slate-100 bg-white">
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
          <div className="group">
            <Link 
              href={backHref}
              className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-400 hover:text-indigo-600 transition-colors mb-6"
            >
              <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" />
              Retour aux POI
            </Link>
            
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-500">
                Fiche publiée
              </p>
              <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 shadow-sm">
                {poi.status}
              </span>
              <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-600 shadow-sm">
                slug verrouillé
              </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 transition-colors">
              {poi.name}
            </h1>
            
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <MapPin size={16} className="text-indigo-500" strokeWidth={2.5} />
                {poi.city.name}
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <Tag size={16} className="text-emerald-500" strokeWidth={2.5} />
                {poi.category.name}
                {poi.subcategory && <span className="text-slate-400 font-medium"> · {poi.subcategory.name}</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4 xl:mt-0">
             {poi.public_url && (
               <Link
                  href={poi.public_url}
                  className="group/link inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-5 py-2.5 text-[13px] font-bold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md"
                >
                  Voir public
                  <ExternalLink size={16} className="transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                </Link>
             )}
             <div className="inline-flex">
               <AdminPoiStatusActions
                 poiId={poi.id}
                 status={poi.status}
                 merchantAttached={poi.merchant_attached}
               />
             </div>
          </div>
        </div>
      </header>

      <div className="px-6 mt-8 md:px-10">
        <AdminPoiEditorBody poi={poi} categories={options.categories} layout="page" />
      </div>
    </div>
  )
}
