import Link from 'next/link'
import { Filter, Plus, Radar } from 'lucide-react'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getAdminPoiOptions, listAdminPois } from '@/features/admin-pois/queries/admin-pois'
import { AdminPoiStatusActions } from '@/features/admin-pois/components/AdminPoiStatusActions'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import type { AdminPoiListFilters } from '@/features/admin-pois/types'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdminPoisPage({ searchParams }: PageProps) {
  await getPageAdmin()
  const params = await searchParams
  const options = await getAdminPoiOptions()
  const selectedCityId = firstParam(params.city_id) ?? options.cities[0]?.id ?? null

  const filters = selectedCityId ? buildFilters(selectedCityId, params) : null
  const response = filters ? await listAdminPois(filters) : null

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">Catalogue public</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Backoffice POI</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-400">
            Gestion opérationnelle des POI publiés par ville : édition, photos, statut public, acquisition et archivage logique.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={selectedCityId ? `/admin/poi-acquisition?city_id=${selectedCityId}` : '/admin/poi-acquisition'}>
              <Radar className="h-4 w-4" />
              Lancer acquisition
            </Link>
          </Button>
          <Button asChild>
            <Link href={selectedCityId ? `/admin/pois/new?city_id=${selectedCityId}` : '/admin/pois/new'}>
              <Plus className="h-4 w-4" />
              Créer POI
            </Link>
          </Button>
        </div>
      </header>

      <form action="/admin/pois" className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="grid gap-4 lg:grid-cols-[260px_1fr_180px_180px_160px]">
          <div>
            <Label htmlFor="city_id" className="text-slate-200">Ville</Label>
            <select
              id="city_id"
              name="city_id"
              defaultValue={selectedCityId ?? ''}
              className="mt-2 h-10 w-full rounded-md bg-white px-3 text-sm text-slate-950"
              required
            >
              {options.cities.map(city => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="q" className="text-slate-200">Recherche</Label>
            <Input id="q" name="q" defaultValue={firstParam(params.q) ?? ''} className="mt-2 bg-white text-slate-950" />
          </div>
          <div>
            <Label htmlFor="category_id" className="text-slate-200">Catégorie</Label>
            <select
              id="category_id"
              name="category_id"
              defaultValue={firstParam(params.category_id) ?? ''}
              className="mt-2 h-10 w-full rounded-md bg-white px-3 text-sm text-slate-950"
            >
              <option value="">Toutes</option>
              {options.categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="status" className="text-slate-200">Statut</Label>
            <select
              id="status"
              name="status"
              defaultValue={firstParam(params.status) ?? 'current'}
              className="mt-2 h-10 w-full rounded-md bg-white px-3 text-sm text-slate-950"
            >
              <option value="current">Courants</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="archived">Archivés</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              <Filter className="h-4 w-4" />
              Filtrer
            </Button>
          </div>
        </div>
      </form>

      {response && (
        <>
          <section className="grid gap-4 md:grid-cols-5">
            <MetricCard title="Actifs" value={response.kpis.active_count} />
            <MetricCard title="Inactifs" value={response.kpis.inactive_count} />
            <MetricCard title="Archivés" value={response.kpis.archived_count} />
            <MetricCard title="Sans photos" value={response.kpis.without_photos_count} />
            <MetricCard title="Géocodage à revoir" value={response.kpis.pending_geocode_count} />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <Card className="border-white/10 bg-white text-slate-950">
              <CardHeader>
                <CardTitle>POI de la ville</CardTitle>
              </CardHeader>
              <CardContent>
                {response.data.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                    <h2 className="text-xl font-semibold">Aucun POI publié pour cette ville</h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Lancez une acquisition ou créez une fiche manuelle pour enrichir le guide local.
                    </p>
                    <div className="mt-5 flex justify-center gap-2">
                      <Button asChild>
                        <Link href={`/admin/poi-acquisition?city_id=${selectedCityId}`}>Lancer acquisition</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href={`/admin/pois/new?city_id=${selectedCityId}`}>Créer POI</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Photo</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Géocodage</TableHead>
                        <TableHead>Photos</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Merchant</TableHead>
                        <TableHead>Dernière mise à jour</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {response.data.map(poi => (
                        <TableRow key={poi.id}>
                          <TableCell>
                            {poi.primary_photo_url ? (
                              <img src={poi.primary_photo_url} alt="" className="h-10 w-14 rounded-lg object-cover" />
                            ) : (
                              <div className="h-10 w-14 rounded-lg bg-slate-200" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{poi.name}</div>
                            <Link href={poi.public_url} className="text-xs text-slate-500 underline">Voir public</Link>
                          </TableCell>
                          <TableCell>
                            {poi.category.name}
                            {poi.subcategory && <span className="block text-xs text-slate-500">{poi.subcategory.name}</span>}
                          </TableCell>
                          <TableCell><StatusBadge status={poi.status} /></TableCell>
                          <TableCell>{poi.geocode_status}</TableCell>
                          <TableCell>{poi.photo_count}</TableCell>
                          <TableCell>{poi.review_source}</TableCell>
                          <TableCell>{poi.merchant_attached ? 'Oui' : 'Non'}</TableCell>
                          <TableCell>{new Date(poi.updated_at).toLocaleDateString('fr-FR')}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/admin/pois/${poi.id}`}>Éditer</Link>
                              </Button>
                              <AdminPoiStatusActions
                                poiId={poi.id}
                                status={poi.status}
                                merchantAttached={poi.merchant_attached}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 text-slate-100">
              <CardHeader>
                <CardTitle>Runs acquisition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {response.acquisition_runs.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucun run récent pour cette ville.</p>
                ) : (
                  response.acquisition_runs.map(run => (
                    <div key={run.id} className="rounded-xl border border-white/10 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{run.category_name}</p>
                        <Badge variant="outline" className="border-white/20 text-slate-200">{run.status}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">
                        {run.candidate_count} candidats · {run.needs_review_count} en revue · {run.published_count} publiés
                      </p>
                      <Button asChild variant="outline" size="sm" className="mt-3">
                        <Link href={`/admin/poi-acquisition/runs/${run.id}`}>Revoir</Link>
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  )
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <Card className="border-white/10 bg-white/10 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-slate-300">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-3xl font-semibold">{value}</CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className="border-slate-300 text-slate-700">
      {status}
    </Badge>
  )
}

function buildFilters(cityId: string, params: Record<string, string | string[] | undefined>): AdminPoiListFilters {
  return {
    city_id: cityId,
    q: firstParam(params.q),
    category_id: firstParam(params.category_id),
    subcategory_id: firstParam(params.subcategory_id),
    status: parseStatus(firstParam(params.status)),
    geocode_status: firstParam(params.geocode_status),
    photo_status: parsePhotoStatus(firstParam(params.photo_status)),
    review_source: parseReviewSource(firstParam(params.review_source)),
    page: Number(firstParam(params.page) ?? 1),
    limit: Number(firstParam(params.limit) ?? 25),
  }
}

function firstParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  return raw && raw.length > 0 ? raw : undefined
}

function parseStatus(value: string | undefined): AdminPoiListFilters['status'] {
  if (value === 'active' || value === 'inactive' || value === 'archived' || value === 'current') return value
  return 'current'
}

function parsePhotoStatus(value: string | undefined): AdminPoiListFilters['photo_status'] {
  if (value === 'with_photos' || value === 'without_photos') return value
  return undefined
}

function parseReviewSource(value: string | undefined): AdminPoiListFilters['review_source'] {
  if (value === 'MANUAL' || value === 'GOOGLE') return value
  return undefined
}
