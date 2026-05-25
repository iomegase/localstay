import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getTrailImportRun } from '@/features/trails-acquisition/queries/runs'
import { AdminTrailCandidateActions } from '@/features/trails-acquisition/components/AdminTrailCandidateActions'

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
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">Revue randonnées</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{run.city_name}</h1>
        <p className="mt-2 text-sm text-slate-400">
          Statut du run: {run.status} · Sources: {run.source_types.join(', ')}
        </p>
        {run.error && (
          <p className="mt-3 max-w-2xl rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {run.error}
          </p>
        )}
      </div>

      <div className="grid gap-4">
        {run.candidates.length === 0 && (
          <Card className="border-white/10 bg-white/5 text-slate-100">
            <CardContent className="p-6 text-sm text-slate-400">
              Aucun candidat randonnée. Vérifiez les sources et URLs fournies.
            </CardContent>
          </Card>
        )}
        {run.candidates.map(candidate => (
          <Card key={candidate.id} className="border-white/10 bg-white/5 text-slate-100">
            <CardHeader>
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <CardTitle className="text-xl">{candidate.title}</CardTitle>
                  <p className="mt-2 text-sm text-slate-400">{candidate.description ?? 'Sans description.'}</p>
                  <p className="mt-1 text-xs text-slate-500">Source principale: {candidate.primary_source_type}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-white/20 text-slate-200">
                    {candidate.geometry_status}
                  </Badge>
                  <Badge variant="outline" className="border-white/20 text-slate-200">
                    {candidate.elevation_status}
                  </Badge>
                  <Badge variant="outline" className="border-white/20 text-slate-200">
                    {candidate.review_status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-400">
              <p>
                Difficulté: {candidate.difficulty ?? 'unknown'} · Distance: {formatDistance(candidate.distance_km)} · Dénivelé: {formatElevation(candidate.elevation_gain_m)} · Durée: {formatDuration(candidate.estimated_duration_min)}
              </p>
              <p>Départ: {candidate.start_label ?? 'Non renseigné'}</p>
              {candidate.start_latitude !== null && candidate.start_longitude !== null && (
                <p>
                  Coordonnées départ: {candidate.start_latitude.toFixed(6)}, {candidate.start_longitude.toFixed(6)}
                </p>
              )}
              {candidate.source_refs.length > 0 && (
                <p>Attribution: {candidate.source_refs.map(source => source.attribution).join(' · ')}</p>
              )}
              {candidate.duplicate_poi_ids.length > 0 && (
                <p>Doublons probables: {candidate.duplicate_poi_ids.join(', ')}</p>
              )}
              <AdminTrailCandidateActions
                candidateId={candidate.id}
                reviewStatus={candidate.review_status}
                duplicatePoiIds={candidate.duplicate_poi_ids}
                geometryStatus={candidate.geometry_status}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

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
