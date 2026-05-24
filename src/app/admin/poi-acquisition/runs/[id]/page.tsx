import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getAcquisitionRun } from '@/features/poi-acquisition/queries/runs'

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
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">Revue candidats</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          {run.city_name} · {run.category_name}
        </h1>
        <p className="mt-2 text-sm text-slate-400">Statut du run: {run.status}</p>
      </div>

      <div className="grid gap-4">
        {run.candidates.map(candidate => (
          <Card key={candidate.id} className="border-white/10 bg-white/5 text-slate-100">
            <CardHeader>
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <CardTitle className="text-xl">{candidate.name}</CardTitle>
                  <p className="mt-2 text-sm text-slate-400">{candidate.address}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-white/20 text-slate-200">
                    {candidate.match_status}
                  </Badge>
                  <Badge variant="outline" className="border-white/20 text-slate-200">
                    {candidate.geocode_status}
                  </Badge>
                  <Badge variant="outline" className="border-white/20 text-slate-200">
                    {candidate.review_status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-400">
              <p>Source: {candidate.source}</p>
              {candidate.google_review_payload?.attribution && (
                <p>
                  <span>Attribution: </span>
                  <span>{candidate.google_review_payload.attribution}</span>
                </p>
              )}
              {candidate.duplicate_poi_ids.length > 0 && (
                <p>Doublons probables: {candidate.duplicate_poi_ids.join(', ')}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
