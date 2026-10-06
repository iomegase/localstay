import { notFound } from 'next/navigation'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getAcquisitionRun } from '@/features/poi-acquisition/queries/runs'
import { AdminCandidateReviewActions } from '@/features/poi-acquisition/components/AdminCandidateReviewActions'
import { AdminCandidateEditDialog } from '@/features/poi-acquisition/components/AdminCandidateEditDialog'
import { AdminResumeRunButton } from '@/features/poi-acquisition/components/AdminResumeRunButton'
import { getManualPoiFormOptions } from '@/features/poi-acquisition/queries/manual-poi'
import { googleTypeLabel } from '@/features/poi-acquisition/lib/google-types'
import type { AcquisitionCandidateDto } from '@/features/poi-acquisition/types'
import { AlertCircle, FileSearch } from 'lucide-react'

// Fonction utilitaire pour générer un style dynamique de badge (Corporate Style)
function getBadgeStyle(text: string) {
  const norm = text.toLowerCase()
  if (norm.includes('match')) return 'border-indigo-100 bg-indigo-50/50 text-indigo-600'
  if (norm.includes('success') || norm.includes('valid')) return 'border-emerald-100 bg-emerald-50/50 text-emerald-600'
  if (norm.includes('review') || norm.includes('attente')) return 'border-amber-100 bg-amber-50/50 text-amber-600'
  if (norm.includes('publish') || norm.includes('publié')) return 'border-[#0B1437]/20 bg-[#F4F7FE] text-[#0B1437]'
  if (norm.includes('reject') || norm.includes('fail')) return 'border-rose-100 bg-rose-50/50 text-rose-600'
  return 'border-gray-200 bg-gray-50 text-gray-500'
}

// Spec 066 AC-01-04 / AC-02-02 : lieux écartés avant traitement.
function skippedLabel(count: number, reason: string): string {
  return `${count} ${count > 1 ? 'lieux ignorés' : 'lieu ignoré'} car ${reason}`
}

// Fonction de formatage pour les gros badges de statuts principaux (En-tête)
function getRunStatusStyle(status: string) {
  const s = status.toUpperCase()
  if (s === 'COMPLETED') return 'bg-emerald-50 text-emerald-600 border-emerald-100/50'
  if (s === 'RUNNING') return 'bg-blue-50 text-blue-600 border-blue-100/50 animate-pulse'
  if (s === 'FAILED') return 'bg-rose-50 text-rose-600 border-rose-100/50'
  if (s === 'PARTIAL') return 'bg-amber-50 text-amber-700 border-amber-100/50'
  return 'bg-gray-100 text-gray-500 border-gray-200/50'
}

export default async function AdminPoiAcquisitionRunPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await getPageAdmin()
  const { id } = await params
  const [run, options] = await Promise.all([getAcquisitionRun(id), getManualPoiFormOptions()])
  
  if (!run) notFound()
  const mainCandidates = run.candidates.filter(candidate => candidate.type_match !== 'secondary')
  const otherCandidates = run.candidates.filter(candidate => candidate.type_match === 'secondary')

  return (
    <div className="w-full animate-in fade-in duration-500 space-y-6">
      
      {/* HEADER : Carte Profilée */}
      <header className="flex flex-col gap-6 rounded-[25px] border border-gray-50 bg-white p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
              Revue candidats
            </p>
            <h1 className="mt-2 flex items-center gap-2 text-3xl font-bold tracking-tight text-neutral-900">
              <span>{run.city_name}</span>
              <span className="text-gray-300">·</span>
              <span className="text-[#0B1437]">{run.category_name}</span>
            </h1>

            {/* Badges d'informations */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={`inline-flex shrink-0 items-center rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getRunStatusStyle(run.status)}`}>
                Statut : {run.status}
              </span>
              <span className="inline-flex shrink-0 items-center rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Total candidats : {run.candidates.length}
              </span>
            </div>

            {/* Spec 072 AC-02-03 : lancement partiel reprenable. */}
            {run.status === 'partial' && run.pending_count > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                <p className="text-[12px] font-semibold text-amber-800">
                  {run.pending_count} {run.pending_count > 1 ? 'lieux restent' : 'lieu reste'} à traiter ({run.processed_count} déjà traités)
                </p>
                <AdminResumeRunButton runId={run.id} />
              </div>
            )}
            {(run.skipped_other_village > 0 || run.skipped_closed_permanently > 0
              || run.skipped_rejected > 0 || run.skipped_excluded > 0 || run.excluded_candidates > 0) && (
              <ul className="mt-3 space-y-1 text-[12px] font-medium text-gray-500">
                {/* Spec 071 AC-04-01 : lieux écartés par la mémoire de revue. */}
                {run.skipped_rejected > 0 && (
                  <li>{run.skipped_rejected} {run.skipped_rejected > 1 ? 'lieux déjà rejetés' : 'lieu déjà rejeté'} pour cette catégorie</li>
                )}
                {run.skipped_excluded > 0 && (
                  <li>{run.skipped_excluded} {run.skipped_excluded > 1 ? 'lieux exclus' : 'lieu exclu'}</li>
                )}
                {run.excluded_candidates > 0 && (
                  <li>{run.excluded_candidates} {run.excluded_candidates > 1 ? 'candidats exclus masqués' : 'candidat exclu masqué'}</li>
                )}
                {run.skipped_other_village > 0 && (
                  <li>{skippedLabel(run.skipped_other_village, 'plus proches d’un autre village')}</li>
                )}
                {run.skipped_closed_permanently > 0 && (
                  <li>{skippedLabel(run.skipped_closed_permanently, 'fermés définitivement')}</li>
                )}
              </ul>
            )}
          </div>

          {/* Affichage des erreurs du Run (si échec complet) */}
          {run.error && (
            <div className="flex max-w-md items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-4 text-[12px] font-bold text-rose-600">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p className="leading-snug">{run.error}</p>
            </div>
          )}
        </div>
      </header>

      {/* TABLE DES CANDIDATS */}
      <div className="w-full rounded-[25px] border border-gray-50 bg-white shadow-sm overflow-hidden">
        
        {run.candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50/30">
             <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 border border-gray-100">
                <FileSearch size={28} strokeWidth={1.5} />
              </div>
            <p className="text-sm font-bold text-neutral-900">Aucun candidat dans ce run.</p>
            <p className="mt-2 text-xs text-gray-500">Vérifiez le statut du run, la configuration Gemini et la catégorie choisie.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-white border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-semibold tracking-widest text-gray-400 uppercase w-[30%]">POI & Adresse</th>
                  <th className="px-6 py-4 text-[10px] font-semibold tracking-widest text-gray-400 uppercase w-[20%]">Statuts</th>
                  <th className="px-6 py-4 text-[10px] font-semibold tracking-widest text-gray-400 uppercase w-[25%]">Origine & Détails</th>
                  <th className="px-6 py-4 text-[10px] font-semibold tracking-widest text-gray-400 uppercase text-right w-[25%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/80 bg-white">
                {mainCandidates.map(candidate => (
                  <CandidateTableRow key={candidate.id} candidate={candidate} categories={options.categories} />
                ))}
              </tbody>
            </table>
            {/* Spec 073 AC-03-02 : lieux au type principal différent, conservés mais relégués (BR-01). */}
            {otherCandidates.length > 0 && (
              <details className="border-t border-gray-100">
                <summary className="cursor-pointer px-6 py-4 text-[12px] font-bold text-gray-500 hover:bg-gray-50/50">
                  Autres types ({otherCandidates.length})
                </summary>
                <table className="w-full text-left whitespace-nowrap">
                  <tbody className="divide-y divide-gray-50/80 bg-white">
                    {otherCandidates.map(candidate => (
                      <CandidateTableRow key={candidate.id} candidate={candidate} categories={options.categories} />
                    ))}
                  </tbody>
                </table>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
function CandidateTableRow({
  candidate,
  categories,
}: {
  candidate: AcquisitionCandidateDto
  categories: Awaited<ReturnType<typeof getManualPoiFormOptions>>['categories']
}) {
  return (
    <tr className="group transition-colors duration-200 hover:bg-gray-50/50">
      
      {/* COL 1 : POI & ADRESSE */}
      <td className="px-6 py-4 align-top whitespace-normal">
        <h3 className="text-[13px] font-bold text-neutral-900 leading-tight">{candidate.name}</h3>
        <p className="mt-1 text-[11px] font-medium leading-relaxed text-gray-500 max-w-sm">
          {candidate.address}
        </p>
        {candidate.duplicate_poi_ids.length > 0 && (
          <div className="mt-2 inline-flex flex-col gap-0.5 rounded-lg border border-amber-200/50 bg-amber-50 px-2 py-1.5 text-[11px] font-bold text-amber-600">
            <span className="text-[9px] uppercase tracking-widest opacity-80">Doublons probables</span>
            <span className="font-mono">{candidate.duplicate_poi_ids.join(', ')}</span>
          </div>
        )}
      </td>
      
      {/* COL 2 : STATUTS */}
      <td className="px-6 py-4 align-top">
        <div className="flex flex-col gap-1.5 items-start">
          <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getBadgeStyle(candidate.match_status)}`}>
            Match: {candidate.match_status}
          </span>
          <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getBadgeStyle(candidate.geocode_status)}`}>
            Geocode: {candidate.geocode_status}
          </span>
          <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getBadgeStyle(candidate.review_status)}`}>
            Revue: {candidate.review_status}
          </span>
          {/* Spec 073 AC-03-03 : type principal Google en français. */}
          {candidate.type_match && (
            <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${candidate.type_match === 'secondary' ? 'border-gray-200 bg-gray-50 text-gray-500' : 'border-sky-100 bg-sky-50 text-sky-700'}`}>
              Type : {googleTypeLabel(candidate.primary_type)}
            </span>
          )}
          {candidate.business_status === 'CLOSED_TEMPORARILY' && (
            <span className="inline-flex items-center rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
              Fermé temporairement (souvent saisonnier)
            </span>
          )}
        </div>
      </td>
      
      {/* COL 3 : ORIGINE & DETAILS */}
      <td className="px-6 py-4 align-top whitespace-normal">
        <div className="flex flex-col gap-1 text-[11px]">
          <p className="text-gray-500">
            <span className="font-semibold text-gray-400">Source:</span> <span className="font-bold text-neutral-900">{candidate.source}</span>
          </p>
          {candidate.google_review_payload?.attribution && (
            <p className="text-gray-400 leading-snug line-clamp-2" title={candidate.google_review_payload.attribution}>
              <span className="font-semibold">Attr:</span> {candidate.google_review_payload.attribution}
            </p>
          )}
        </div>
      </td>

      {/* COL 4 : ACTIONS */}
      <td className="px-6 py-4 align-top">
        {/* Disposition Horizontale pour tout aligner */}
        <div className="flex items-center justify-end gap-2 mt-0.5">
          
          {/* Actions de Revue (Publier / Rejeter gérés par ce composant) */}
          <AdminCandidateReviewActions
            candidateId={candidate.id}
            reviewStatus={candidate.review_status}
            duplicatePoiIds={candidate.duplicate_poi_ids}
          />
          
          {candidate.review_status === 'needs_review' && (
            <>
              <div className="mx-1 h-6 w-px bg-gray-200"></div>
              {/* Spec 071 US-01 : modifier avant publication. */}
              <AdminCandidateEditDialog candidate={candidate} categories={categories} />
            </>
          )}
        </div>
      </td>
    </tr>
  )
}
