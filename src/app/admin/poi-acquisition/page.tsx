import Link from 'next/link'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { listAcquisitionRuns } from '@/features/poi-acquisition/queries/runs'
import { getManualPoiFormOptions } from '@/features/poi-acquisition/queries/manual-poi'
import { AdminAcquisitionLauncher } from '@/features/poi-acquisition/components/AdminAcquisitionLauncher'
import { DeleteAcquisitionRunButton } from '@/features/poi-acquisition/components/DeleteAcquisitionRunButton'
import { CleanupStaleCandidatesButton } from '@/features/trails-acquisition/components/CleanupStaleCandidatesButton'
import {
  Tag,
  AlertCircle,
  ArrowRight,
  Plus
} from 'lucide-react'

export default async function AdminPoiAcquisitionPage() {
  await getPageAdmin()
  const [runs, options] = await Promise.all([
    listAcquisitionRuns(),
    getManualPoiFormOptions(),
  ])

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col justify-between gap-6 pb-2 md:flex-row md:items-end">
        <div className="group">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-500">
            Pipeline hybride
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 transition-colors">
            Acquisition POI
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            Lancements Gemini, matching Google, géocodage Mapbox et revue manuelle avant publication. 
            Cette étape crée des candidats ; un POI public apparaît seulement après publication admin.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <CleanupStaleCandidatesButton />
          <Link
            href="/admin/pois/new"
            className="group relative flex h-10 items-center justify-center overflow-hidden rounded-2xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-200 w-fit"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Plus size={16} />
              Créer POI
            </span>
          </Link>
        </div>
      </header>

      <AdminAcquisitionLauncher cities={options.cities} categories={options.categories} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {runs.length === 0 ? (
          <div className="col-span-full flex h-40 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-500">Aucun run d&apos;acquisition pour le moment.</p>
          </div>
        ) : (
          runs.map(run => (
            <div 
              key={run.id} 
              className="group flex flex-col justify-between overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
            >
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800 line-clamp-1" title={run.city_name}>
                      {run.city_name}
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-slate-500">
                      <Tag size={13} className="text-indigo-400" />
                      <span className="truncate" title={run.category_name}>{run.category_name}</span>
                    </div>
                  </div>
                  <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    run.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                    run.status === 'FAILED' ? 'bg-rose-50 text-rose-600' :
                    run.status === 'RUNNING' ? 'bg-blue-50 text-blue-600 animate-pulse' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {run.status}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2 border-t border-slate-50 pt-4">
                  <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 p-2">
                    <span className="text-lg font-bold text-slate-700">{run.candidate_count}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-center">Candidats</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-amber-50 p-2 transition-colors group-hover:bg-amber-100/50">
                    <span className="text-lg font-bold text-amber-700">{run.needs_review_count}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600/70 text-center">À revoir</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-xl bg-emerald-50 p-2 transition-colors group-hover:bg-emerald-100/50">
                    <span className="text-lg font-bold text-emerald-700">{run.published_count}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600/70 text-center">Publiés</span>
                  </div>
                </div>

                {run.error && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-600">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p className="leading-snug line-clamp-2" title={run.error}>{run.error}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-50 p-2">
                <Link
                  href={`/admin/poi-acquisition/runs/${run.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-indigo-600"
                >
                  Ouvrir les détails
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <DeleteAcquisitionRunButton
                  runId={run.id}
                  label={`${run.city_name} · ${run.category_name}`}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}