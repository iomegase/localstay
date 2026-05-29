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
      <div className="rounded-[25px] border border-gray-50 bg-white shadow-sm overflow-hidden">
        <CandidatesTable candidates={run.candidates} />
      </div>
    </div>
  )
}

function RunHeader({ run }: { run: any }) {
  const stats = computeStats(run.candidates ?? [])
  return (
    <header className="rounded-[25px] border border-gray-50 bg-white p-8 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
        Revue randonnées
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">
        {run.city_name}
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        Statut : <span className="font-medium text-neutral-900">{run.status}</span>
        {' · '}Sources : {run.source_types.join(', ')}
        {run.zone_radius_km != null && (
          <> · Rayon : <span className="font-medium text-neutral-900">{run.zone_radius_km} km</span></>
        )}
      </p>

      {stats.total > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 max-w-4xl">
          <StatBox label="Total" value={stats.total} color="text-neutral-900" />
          <StatBox label="Complets" value={stats.complete} color="text-emerald-600" />
          <StatBox label="Partiels" value={stats.partial} color="text-amber-600" />
          <StatBox label="Géom. valide" value={stats.geometryValid} color="text-emerald-600" />
          <StatBox label="Élév. valide" value={stats.elevationValid} color="text-emerald-600" />
          <StatBox label="Publiés" value={stats.published} color="text-[#0B1437]" />
        </div>
      )}

      {run.error && (
        <p className="mt-4 max-w-2xl rounded-xl border border-rose-100 bg-rose-50/60 px-4 py-3 text-sm text-rose-600">
          {run.error}
        </p>
      )}
    </header>
  )
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
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
