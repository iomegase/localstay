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

const STATUS_STYLES = {
  COMPLETED: 'bg-emerald-50/80 text-emerald-600 border-emerald-100/50',
  FAILED: 'bg-rose-50/80 text-rose-600 border-rose-100/50',
  RUNNING: 'bg-blue-50/80 text-blue-600 border-blue-100/50 animate-pulse',
  DEFAULT: 'bg-gray-100/80 text-gray-500 border-gray-200/50',
}

export default async function AdminPoiAcquisitionPage() {
  await getPageAdmin()
  const [runs, options] = await Promise.all([
    listAcquisitionRuns(),
    getManualPoiFormOptions(),
  ])

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header façon Carte Blanche */}
      <header className="flex flex-col justify-between gap-6 md:flex-row md:items-center rounded-[25px] border border-gray-50 bg-white p-8 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
            Pipeline hybride
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">
            Acquisition POI
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Lancements Gemini, matching Google, géocodage Mapbox et revue manuelle avant publication. 
            Cette étape crée des candidats ; un POI public apparaît seulement après publication admin.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <CleanupStaleCandidatesButton />
          <Link
            href="/admin/pois/new"
            className="group flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0B1437] px-6 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-gray-900 hover:shadow-md"
          >
            <Plus size={16} />
            Créer POI
          </Link>
        </div>
      </header>

      {/* Lanceur (Composant existant) */}
      <AdminAcquisitionLauncher cities={options.cities} categories={options.categories} />

      {/* Tableau des Runs (Corporate Style) */}
      <div className="w-full overflow-hidden rounded-[25px] border border-gray-50 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            
            <thead className="bg-white border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-[11px] font-semibold tracking-widest text-gray-400 uppercase">Cible (Ville & Catégorie)</th>
                <th className="px-6 py-5 text-center text-[11px] font-semibold tracking-widest text-gray-400 uppercase">Statut</th>
                <th className="px-6 py-5 text-center text-[11px] font-semibold tracking-widest text-gray-400 uppercase">Candidats</th>
                <th className="px-6 py-5 text-center text-[11px] font-semibold tracking-widest text-gray-400 uppercase">À revoir</th>
                <th className="px-6 py-5 text-center text-[11px] font-semibold tracking-widest text-gray-400 uppercase">Publiés</th>
                <th className="px-8 py-5 text-right text-[11px] font-semibold tracking-widest text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-50/80 bg-white">
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-48 text-center text-sm font-medium text-gray-400 bg-gray-50/30">
                    Aucun run d'acquisition pour le moment.
                  </td>
                </tr>
              ) : (
                runs.map(run => (
                  <tr 
                    key={run.id} 
                    className="group transition-colors duration-200 hover:bg-gray-50/50"
                  >
                    {/* Colonne Cible & Erreurs */}
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-neutral-900">{run.city_name}</span>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                          <Tag size={12} className="text-[#0B1437]/40" />
                          <span className="truncate max-w-[200px]" title={run.category_name}>
                            {run.category_name}
                          </span>
                        </div>
                        {/* Affichage des erreurs en ligne sous le nom de la ville pour ne pas casser la table */}
                        {run.error && (
                          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-rose-500 max-w-[250px]">
                            <AlertCircle size={12} className="shrink-0" />
                            <span className="truncate" title={run.error}>{run.error}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Badge Statut */}
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex shrink-0 items-center rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        STATUS_STYLES[run.status as keyof typeof STATUS_STYLES] || STATUS_STYLES.DEFAULT
                      }`}>
                        {run.status}
                      </span>
                    </td>

                    {/* Statistiques alignées et propres */}
                    <td className="px-6 py-5 text-center">
                      <span className="text-[15px] font-bold text-neutral-900">
                        {run.candidate_count}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <span className="text-[15px] font-bold text-amber-600">
                        {run.needs_review_count}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <span className="text-[15px] font-bold text-emerald-600">
                        {run.published_count}
                      </span>
                    </td>

                    {/* Actions (Détails + Bouton de suppression) */}
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link 
                          href={`/admin/poi-acquisition/runs/${run.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4F7FE] px-4 py-2.5 text-[13px] font-bold text-[#0B1437] transition-all duration-300 hover:bg-[#0B1437] hover:text-white"
                        >
                          Détails
                          <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                        
                        {/* Le bouton de suppression côté client vient s'insérer ici naturellement */}
                        <DeleteAcquisitionRunButton
                          runId={run.id}
                          label={`${run.city_name} · ${run.category_name}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}