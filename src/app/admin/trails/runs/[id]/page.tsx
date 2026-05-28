import { notFound } from 'next/navigation'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getTrailImportRun } from '@/features/trails-acquisition/queries/runs'
import { CandidatesTable } from '@/features/trails-acquisition/components/CandidatesTable'

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
        {run.zone_radius_km != null && (
          <> · Rayon: <span className="font-medium">{run.zone_radius_km} km</span></>
        )}
      </p>

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
