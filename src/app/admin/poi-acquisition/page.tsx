import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { listAcquisitionRuns } from '@/features/poi-acquisition/queries/runs'
import { getManualPoiFormOptions } from '@/features/poi-acquisition/queries/manual-poi'
import { AdminAcquisitionLauncher } from '@/features/poi-acquisition/components/AdminAcquisitionLauncher'

export default async function AdminPoiAcquisitionPage() {
  await getPageAdmin()
  const [runs, options] = await Promise.all([
    listAcquisitionRuns(),
    getManualPoiFormOptions(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">Pipeline hybride</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Acquisition POI</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Lancements Gemini, matching Google, géocodage Mapbox et revue manuelle avant publication.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/pois/new">Créer POI</Link>
        </Button>
      </div>

      <AdminAcquisitionLauncher cities={options.cities} categories={options.categories} />

      <div className="grid gap-4">
        {runs.length === 0 && (
          <Card className="border-white/10 bg-white/5 text-slate-100">
            <CardContent className="p-6 text-sm text-slate-400">Aucun run d'acquisition pour le moment.</CardContent>
          </Card>
        )}
        {runs.map(run => (
          <Card key={run.id} className="border-white/10 bg-white/5 text-slate-100">
            <CardHeader className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <CardTitle className="text-xl">
                  <span>{run.city_name}</span>
                  <span> · {run.category_name}</span>
                </CardTitle>
                <p className="mt-2 text-sm text-slate-400">
                  <span>{run.candidate_count} candidats</span>
                  <span> · {run.needs_review_count} en revue · {run.published_count} publiés</span>
                </p>
              </div>
              <Badge variant="outline" className="w-fit border-white/20 text-slate-200">
                {run.status}
              </Badge>
            </CardHeader>
            <CardContent className="flex justify-end p-6 pt-0">
              <Button asChild variant="outline">
                <Link href={`/admin/poi-acquisition/runs/${run.id}`}>Ouvrir</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
