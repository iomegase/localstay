import Link from 'next/link'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { AdminTrailsLauncher } from '@/features/trails-acquisition/components/AdminTrailsLauncher'
import { CleanupStaleCandidatesButton } from '@/features/trails-acquisition/components/CleanupStaleCandidatesButton'
import { RefineTrailGeometryButton } from '@/features/trails-acquisition/components/RefineTrailGeometryButton'
import { DeleteRunButton } from '@/features/trails-acquisition/components/DeleteRunButton'
import { getTrailAcquisitionOptions } from '@/features/trails-acquisition/queries/options'
import { listTrailImportRuns } from '@/features/trails-acquisition/queries/runs'
import { ArrowRight, Plus, AlertCircle, Map } from 'lucide-react'

type TrailImportRunList = Awaited<ReturnType<typeof listTrailImportRuns>>

// Styles pour les statuts
const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-emerald-50/80 text-emerald-600 border-emerald-100/50',
  FAILED: 'bg-rose-50/80 text-rose-600 border-rose-100/50',
  RUNNING: 'bg-blue-50/80 text-blue-600 border-blue-100/50 animate-pulse',
  DEFAULT: 'bg-gray-100/80 text-gray-500 border-gray-200/50',
}

// --- COMPOSANT PRINCIPAL ---
export default async function AdminTrailsPage() {
  await getPageAdmin()

  // Logique métier inchangée
  const [runs, options] = await Promise.all([
    listTrailImportRuns(),
    getTrailAcquisitionOptions(),
  ])

  return (
    <div className="w-full animate-in fade-in duration-500 space-y-6">
      <PageHeader />
      
      {/* Lanceur existant (à l'identique de l'architecture) */}
      <AdminTrailsLauncher cities={options.cities} />
      
      {/* Remplacement des cartes par le tableau corporate */}
      <RunsTable runs={runs} />
    </div>
  )
}

// --- SOUS-COMPOSANTS ---

function PageHeader() {
  return (
    <header className="flex flex-col justify-between gap-6 rounded-[25px] border border-gray-50 bg-white p-8 shadow-sm md:flex-row md:items-center">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
          Pipeline randonnée
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">
          Acquisition randonnées
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Acquisition multi-sources côté serveur, validation Super-admin obligatoire, puis publication comme POI Rando avec TrailDetail.
        </p>
      </div>
      
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        <RefineTrailGeometryButton />
        <CleanupStaleCandidatesButton />
        <Link
          href="/admin/trails/new"
          className="group flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0B1437] px-6 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-gray-900 hover:shadow-md"
        >
          <Plus size={16} className="transition-transform duration-300 group-hover:scale-110" />
          Créer randonnée
        </Link>
      </div>
    </header>
  )
}

function RunsTable({ runs }: { runs: TrailImportRunList }) {
  return (
    <div className="w-full overflow-hidden rounded-[25px] border border-gray-50 bg-white shadow-sm">
      <div className="border-b border-gray-100 p-6">
        <h2 className="text-base font-bold text-neutral-900">Historique des imports</h2>
      </div>

      {runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50/30">
          <p className="text-sm font-medium text-gray-500">Aucun run actif</p>
          <p className="mt-1 text-xs text-gray-400">Les imports de randonnées apparaîtront ici.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-white border-b border-gray-100">
              <tr>
                {/* Tailles de police réduites au minimum lisible (10px) pour l'en-tête */}
                <th className="px-6 py-4 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Cible & Configuration</th>
                <th className="px-6 py-4 text-center text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Statut</th>
                <th className="px-6 py-4 text-center text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Candidats</th>
                <th className="px-6 py-4 text-center text-[10px] font-semibold tracking-widest text-gray-400 uppercase">À revoir</th>
                <th className="px-6 py-4 text-center text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Publiés</th>
                <th className="px-6 py-4 text-right text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/80 bg-white">
              {runs.map(run => (
                <tr key={run.id} className="group transition-colors duration-200 hover:bg-gray-50/50">
                  
                  {/* Colonne Cible */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-neutral-900">{run.city_name}</span>
                      
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-gray-400">
                        <Map size={12} className="text-[#0B1437]/40" />
                        <span className="truncate max-w-[200px]" title={run.source_types.join(', ')}>
                          {run.source_types.join(', ')}
                        </span>
                        {run.zone_radius_km != null && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-[#0B1437]/60">Rayon {run.zone_radius_km}km</span>
                          </>
                        )}
                      </div>

                      {/* Affichage de l'erreur sans casser le tableau */}
                      {run.error && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-rose-500 max-w-[250px]">
                          <AlertCircle size={12} className="shrink-0" />
                          <span className="truncate" title={run.error}>{run.error}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Statut Badge */}
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex shrink-0 items-center rounded-lg border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      STATUS_STYLES[run.status as keyof typeof STATUS_STYLES] || STATUS_STYLES.DEFAULT
                    }`}>
                      {run.status}
                    </span>
                  </td>

                  {/* KPIs (police réduite à 13px) */}
                  <td className="px-6 py-4 text-center">
                    <span className="text-[13px] font-bold text-neutral-900">
                      {run.candidate_count}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="text-[13px] font-bold text-amber-600">
                      {run.needs_review_count}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="text-[13px] font-bold text-emerald-600">
                      {run.published_count}
                    </span>
                  </td>

                  {/* Actions alignées à droite */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        href={`/admin/trails/runs/${run.id}`}
                        className="inline-flex h-[32px] items-center justify-center gap-1.5 rounded-lg bg-[#F4F7FE] px-3 text-[11px] font-bold text-[#0B1437] transition-all duration-300 hover:bg-[#0B1437] hover:text-white"
                      >
                        Ouvrir
                        <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                      </Link>
                      
                      <DeleteRunButton 
                        runId={run.id} 
                        cityName={run.city_name} 
                      />
                    </div>
                  </td>
                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
