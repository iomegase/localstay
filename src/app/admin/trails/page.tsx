import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { AdminTrailsLauncher } from '@/features/trails-acquisition/components/AdminTrailsLauncher'
import { getTrailAcquisitionOptions } from '@/features/trails-acquisition/queries/options'
import { listTrailImportRuns } from '@/features/trails-acquisition/queries/runs'

// --- COMPOSANT PRINCIPAL ---
export default async function AdminTrailsPage() {
  await getPageAdmin()

  // La logique métier et le fetch concurrentiel restent identiques
  const [runs, options] = await Promise.all([
    listTrailImportRuns(),
    getTrailAcquisitionOptions(),
  ])

  return (
    <div className="space-y-6">
      <PageHeader />
      <AdminTrailsLauncher cities={options.cities} />
      <RunsList runs={runs} />
    </div>
  )
}

// --- SOUS-COMPOSANTS ---

function PageHeader() {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
          Pipeline randonnée
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Acquisition randonnées
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Acquisition multi-sources côté serveur, validation Super-admin obligatoire, puis publication comme POI Rando avec TrailDetail.
        </p>
      </div>
      <Button asChild>
        <Link href="/admin/trails/new">Créer randonnée</Link>
      </Button>
    </div>
  )
}

function RunsList({ runs }: { runs: any[] }) {
  // Gestion claire de l'état vide (Early return)
  if (runs.length === 0) {
    return (
      <Card className="border-white/10 bg-white/5 text-slate-100">
        <CardContent className="p-6 text-sm text-slate-400">
          Aucun run randonnée pour le moment.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {runs.map((run) => (
        <RunCard key={run.id} run={run} />
      ))}
    </div>
  )
}

function RunCard({ run }: { run: any }) {
  return (
    <Card className="border-white/10 bg-white/5 text-slate-100">
      <CardHeader className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <CardTitle className="text-xl">{run.city_name}</CardTitle>
          <p className="mt-2 text-sm text-slate-400">
            {run.candidate_count} candidats · {run.needs_review_count} en revue · {run.published_count} publiés
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Sources: {run.source_types.join(', ')}
          </p>
        </div>
        <Badge variant="outline" className="w-fit border-white/20 text-slate-200">
          {run.status}
        </Badge>
      </CardHeader>
      
      <CardContent className="flex justify-end p-6 pt-0">
        {run.error && (
          <p className="mr-auto max-w-2xl rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {run.error}
          </p>
        )}
        <Button asChild variant="outline">
          <Link href={`/admin/trails/runs/${run.id}`}>Ouvrir</Link>
        </Button>
      </CardContent>
    </Card>
  )
}