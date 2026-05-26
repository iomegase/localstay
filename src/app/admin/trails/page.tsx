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

  // Logique métier inchangée
  const [runs, options] = await Promise.all([
    listTrailImportRuns(),
    getTrailAcquisitionOptions(),
  ])

  return (
    <div className="space-y-8">
      <PageHeader />
      <AdminTrailsLauncher cities={options.cities} />
      <RunsList runs={runs} />
    </div>
  )
}

// --- SOUS-COMPOSANTS ---

function PageHeader() {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center border-b border-slate-100 pb-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Pipeline randonnée
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
          Acquisition randonnées
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Acquisition multi-sources côté serveur, validation Super-admin obligatoire, puis publication comme POI Rando avec TrailDetail.
        </p>
      </div>
      <Button asChild className="shrink-0">
        <Link href="/admin/trails/new">Créer randonnée</Link>
      </Button>
    </div>
  )
}

function RunsList({ runs }: { runs: any[] }) {
  if (runs.length === 0) {
    return (
      <Card className="border-dashed border-slate-200 bg-slate-50 shadow-none">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <p className="text-sm font-medium text-slate-600">Aucun run actif</p>
          <p className="mt-1 text-sm text-slate-400">
            Les imports de randonnées apparaîtront ici.
          </p>
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
    <Card className="border border-slate-200 bg-slate-100 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-col justify-between gap-4 pb-4 md:flex-row md:items-start">
        <div>
          <CardTitle className="text-lg font-semibold text-slate-900">
            {run.city_name}
          </CardTitle>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <span><strong className="font-medium text-slate-700">{run.candidate_count}</strong> candidats</span>
            <span>·</span>
            <span><strong className="font-medium text-slate-700">{run.needs_review_count}</strong> en revue</span>
            <span>·</span>
            <span><strong className="font-medium text-slate-700">{run.published_count}</strong> publiés</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Sources : {run.source_types.join(', ')}
          </p>
        </div>
        
        <Badge variant="secondary" className="w-fit bg-slate-100 text-slate-600 hover:bg-slate-200">
          {run.status}
        </Badge>
      </CardHeader>
      
      <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-0">
        <div className="flex-1">
          {run.error && (
            <p className="max-w-2xl rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
              {run.error}
            </p>
          )}
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0 bg-white">
          <Link href={`/admin/trails/runs/${run.id}`}>Ouvrir le run</Link>
        </Button>
      </CardContent>
    </Card>
  )
}