import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/shared/components/ui/card'
import { ExternalLink } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getTrailImportRun } from '@/features/trails-acquisition/queries/runs'
import { AdminTrailCandidateActions } from '@/features/trails-acquisition/components/AdminTrailCandidateActions'

// --- COMPOSANT PRINCIPAL ---
export default async function AdminTrailRunPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await getPageAdmin()
  const { id } = await params
  const run = await getTrailImportRun(id)
  
  if (!run) notFound()

  return (
    <div className="space-y-6">
      <RunHeader run={run} />
      <CandidatesTable candidates={run.candidates} />
    </div>
  )
}

// --- SOUS-COMPOSANTS ---

function RunHeader({ run }: { run: any }) {
  const stats = computeStats(run.candidates ?? [])
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
        Revue randonnées
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900">
        {run.city_name}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Statut du run: <span className="font-medium">{run.status}</span> · Sources: {run.source_types.join(', ')}
      </p>

      {/* État synthétique du run */}
      {stats.total > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 max-w-4xl">
          <StatBox label="Total" value={stats.total} color="text-slate-900" />
          <StatBox label="Complets" value={stats.complete} color="text-emerald-700" />
          <StatBox label="Partiels" value={stats.partial} color="text-amber-700" />
          <StatBox label="Géom. valide" value={stats.geometryValid} color="text-emerald-700" />
          <StatBox label="Élév. valide" value={stats.elevationValid} color="text-emerald-700" />
          <StatBox label="Publiés" value={stats.published} color="text-indigo-700" />
        </div>
      )}

      {run.error && (
        <p className="mt-3 max-w-2xl rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {run.error}
        </p>
      )}
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-0.5 text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function computeStats(candidates: any[]) {
  const total = candidates.length
  let geometryValid = 0, elevationValid = 0, complete = 0, partial = 0, published = 0
  for (const c of candidates) {
    if (c.geometry_status === 'valid') geometryValid += 1
    if (c.elevation_status === 'valid') elevationValid += 1
    if (c.data_quality_status === 'complete') complete += 1
    else partial += 1
    if (c.review_status === 'published') published += 1
  }
  return { total, geometryValid, elevationValid, complete, partial, published }
}

function StatusBadge({ label, value }: { label: string; value: string }) {
  const colorClass = badgeColorForStatus(value)
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colorClass}`}>
      <span className="opacity-70">{label}</span>
      <span>{value}</span>
    </span>
  )
}

function badgeColorForStatus(value: string): string {
  switch (value) {
    case 'valid':
    case 'published':
    case 'complete':
      return 'border-emerald-300 bg-emerald-50 text-emerald-700'
    case 'needs_review':
      return 'border-amber-300 bg-amber-50 text-amber-700'
    case 'missing':
    case 'failed':
    case 'rejected':
    case 'invalid':
      return 'border-red-200 bg-red-50 text-red-700'
    case 'merged':
      return 'border-indigo-200 bg-indigo-50 text-indigo-700'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600'
  }
}

function candidateScore(candidate: any): number {
  // Tri : 'complete' geom+elev en premier, puis 'valid' partiel, puis 'missing'
  let score = 0
  if (candidate.geometry_status === 'valid') score += 4
  if (candidate.elevation_status === 'valid') score += 2
  if (candidate.data_quality_status === 'complete') score += 1
  return score
}

function CandidatesTable({ candidates }: { candidates: any[] }) {
  if (candidates.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-slate-600">
          Aucun candidat randonnée. Vérifiez les sources et URLs fournies.
        </CardContent>
      </Card>
    )
  }

  // Tri : score décroissant (valides en premier), puis alphabétique
  const sortedCandidates = [...candidates].sort((a, b) => {
    const diff = candidateScore(b) - candidateScore(a)
    if (diff !== 0) return diff
    return (a.title || '').localeCompare(b.title || '', 'fr', { ignorePunctuation: true })
  })

  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead className="w-[35%]">Randonnée</TableHead>
            <TableHead>Métriques</TableHead>
            <TableHead>Statuts & Sources</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCandidates.map((candidate, index) => (
            <CandidateRow key={candidate.id} candidate={candidate} rowNumber={index + 1} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function CandidateRow({ candidate, rowNumber }: { candidate: any; rowNumber: number }) {
  return (
    <TableRow>
      {/* Colonne 0 : Numéro */}
      <TableCell className="align-top text-center text-sm font-mono text-slate-400">
        {rowNumber}
      </TableCell>

      {/* Colonne 1 : Infos principales */}
      <TableCell className="align-top">
        <p className="font-semibold text-slate-900 text-base">{candidate.title}</p>
        <p className="mt-1 text-sm text-slate-600 line-clamp-2" title={candidate.description}>
          {candidate.description ?? 'Sans description.'}
        </p>
        
        <div className="mt-3 space-y-1 text-xs text-slate-500">
          <p><span className="font-medium text-slate-700">Départ:</span> {candidate.start_label ?? 'Non renseigné'}</p>
          {candidate.start_latitude !== null && candidate.start_longitude !== null && (
            <p>
              <span className="font-medium text-slate-700">Coords:</span> {candidate.start_latitude.toFixed(6)}, {candidate.start_longitude.toFixed(6)}
            </p>
          )}
        </div>
      </TableCell>

      {/* Colonne 2 : Métriques (Distance, Durée, etc.) */}
      <TableCell className="align-top text-sm text-slate-600">
        <ul className="space-y-1.5">
          <li><span className="text-slate-400">Dist. :</span> {formatDistance(candidate.distance_km)}</li>
          <li><span className="text-slate-400">Déniv. :</span> {formatElevation(candidate.elevation_gain_m)}</li>
          <li><span className="text-slate-400">Durée :</span> {formatDuration(candidate.estimated_duration_min)}</li>
          <li><span className="text-slate-400">Diff. :</span> {candidate.difficulty ?? 'inconnue'}</li>
        </ul>
      </TableCell>

      {/* Colonne 3 : Statuts & Sources */}
      <TableCell className="align-top">
        <div className="flex flex-wrap gap-1.5 mb-3">
          <StatusBadge label="Géom." value={candidate.geometry_status} />
          <StatusBadge label="Élév." value={candidate.elevation_status} />
          <StatusBadge label="Revue" value={candidate.review_status} />
        </div>
        
        <div className="text-xs text-slate-500 space-y-1">
          <p><span className="font-medium text-slate-700">Source:</span> {candidate.primary_source_type}</p>
          {candidate.source_refs.length > 0 && (
            <p className="line-clamp-2" title={candidate.source_refs.map((s: any) => s.attribution).join(' · ')}>
              <span className="font-medium text-slate-700">Attr:</span> {candidate.source_refs.map((s: any) => s.attribution).join(', ')}
            </p>
          )}
        </div>
      </TableCell>

      {/* Colonne 4 : Actions */}
      <TableCell className="align-top text-right space-y-3">
        {candidate.duplicate_poi_ids.length > 0 && (
          <div className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 inline-block border border-amber-200">
            Doublons : {candidate.duplicate_poi_ids.join(', ')}
          </div>
        )}
        
        <div className="flex justify-end">
          <AdminTrailCandidateActions
            candidateId={candidate.id}
            reviewStatus={candidate.review_status}
            duplicatePoiIds={candidate.duplicate_poi_ids}
            geometryStatus={candidate.geometry_status}
          />
        </div>
        {candidate.published_poi_id && (
          <Link
            href={`/admin/pois/${candidate.published_poi_id}`}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700"
          >
            <ExternalLink className="h-3 w-3" />
            Gérer la fiche & photos
          </Link>
        )}
      </TableCell>
    </TableRow>
  )
}

// --- HELPERS (Inchangés) ---

function formatDistance(value: number | null): string {
  return value === null ? 'n/a' : `${value.toFixed(1)} km`
}

function formatElevation(value: number | null): string {
  return value === null ? 'n/a' : `${value} m`
}

function formatDuration(value: number | null): string {
  if (value === null) return 'n/a'
  const hours = Math.floor(value / 60)
  const minutes = value % 60
  if (hours > 0 && minutes > 0) return `${hours} h ${minutes.toString().padStart(2, '0')}`
  if (hours > 0) return `${hours} h`
  return `${minutes} min`
}