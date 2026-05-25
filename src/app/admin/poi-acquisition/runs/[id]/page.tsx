import { notFound } from 'next/navigation'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getAcquisitionRun } from '@/features/poi-acquisition/queries/runs'
import { AdminCandidateReviewActions } from '@/features/poi-acquisition/components/AdminCandidateReviewActions'
import { Eye, Trash2 } from 'lucide-react'

// Fonction utilitaire pour générer un style dynamique de badge (si besoin de flexibilité)
// Nous utilisons directement les couleurs adaptées dans le composant pour matcher votre maquette
function getBadgeStyle(text: string) {
  const norm = text.toLowerCase()
  if (norm.includes('match')) return 'bg-indigo-50 text-indigo-600'
  if (norm.includes('success') || norm.includes('valid')) return 'bg-emerald-50 text-emerald-600'
  if (norm.includes('review') || norm.includes('attente')) return 'bg-amber-50 text-amber-600'
  if (norm.includes('publish') || norm.includes('publié')) return 'bg-orange-50 text-orange-600'
  return 'bg-slate-50 text-slate-600'
}

export default async function AdminPoiAcquisitionRunPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await getPageAdmin()
  const { id } = await params
  const run = await getAcquisitionRun(id)
  if (!run) notFound()

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER */}
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-500">
          Revue candidats
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-900">
          <span>{run.city_name}</span>
          <span className="text-slate-300">·</span>
          <span>{run.category_name}</span>
        </h1>
        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            STATUT DU RUN : {run.status}
          </span>
        </div>
        
        {run.error && (
          <div className="mt-4 max-w-2xl rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
            {run.error}
          </div>
        )}
      </div>

      {/* TABLE DES CANDIDATS */}
      <div className="w-full rounded-[24px] border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-50 px-6 py-6">
          <h2 className="text-lg font-bold text-slate-800">
            Liste des candidats ({run.candidates.length})
          </h2>
        </div>

        {run.candidates.length === 0 ? (
          <div className="flex h-40 items-center justify-center p-6 text-sm text-slate-500 bg-slate-50/50">
            Aucun candidat dans ce run. Vérifiez le statut du run, la configuration Gemini et la catégorie choisie.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[13px] font-semibold text-slate-500 w-[30%]">POI & Adresse</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-slate-500 w-[20%]">Statuts</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-slate-500 w-[25%]">Origine & Détails</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-slate-500 text-right w-[25%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {run.candidates.map((candidate) => (
                  <tr key={candidate.id} className="group transition-colors hover:bg-slate-50/50">
                    
                    {/* COL 1 : POI & ADRESSE */}
                    <td className="px-6 py-5 align-top">
                      <h3 className="font-semibold text-slate-900 leading-tight">{candidate.name}</h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 max-w-sm">
                        {candidate.address}
                      </p>
                      {candidate.duplicate_poi_ids.length > 0 && (
                        <div className="mt-3 inline-flex flex-col gap-1 rounded-lg border border-amber-100/50 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700">
                          <span className="text-[9px] uppercase tracking-widest opacity-70">Doublons probables</span>
                          <span>{candidate.duplicate_poi_ids.join(', ')}</span>
                        </div>
                      )}
                    </td>
                    
                    {/* COL 2 : STATUTS */}
                    <td className="px-6 py-5 align-top">
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-600">
                          {candidate.match_status}
                        </span>
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-600">
                          {candidate.geocode_status}
                        </span>
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium ${getBadgeStyle(candidate.review_status)}`}>
                          {candidate.review_status}
                        </span>
                      </div>
                    </td>
                    
                    {/* COL 3 : ORIGINE & DETAILS */}
                    <td className="px-6 py-5 align-top">
                      <div className="space-y-1.5 text-[13px] text-slate-500">
                        <p>Source:<br/><span className="font-medium text-slate-800">{candidate.source}</span></p>
                        {candidate.google_review_payload?.attribution && (
                          <p>Attr: <span className="text-slate-600">{candidate.google_review_payload.attribution}</span></p>
                        )}
                      </div>
                    </td>

                    {/* COL 4 : ACTIONS */}
                    <td className="px-6 py-5 align-top">
                      <div className="flex items-center justify-end gap-5 h-full">
                        <div className="flex justify-end">
                          <AdminCandidateReviewActions
                            candidateId={candidate.id}
                            reviewStatus={candidate.review_status}
                            duplicatePoiIds={candidate.duplicate_poi_ids}
                          />
                        </div>
                        
                        <div className="flex flex-col gap-3 border-l border-slate-100 pl-5 py-1">
                          <button 
                            type="button"
                            className="text-slate-300 transition-colors hover:text-indigo-600"
                            title="Voir détails"
                          >
                            <Eye size={18} strokeWidth={2} />
                          </button>
                          <button 
                            type="button"
                            className="text-slate-300 transition-colors hover:text-rose-600"
                            title="Supprimer candidat"
                          >
                            <Trash2 size={18} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}