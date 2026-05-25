import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getAdminPoi, getAdminPoiOptions } from '@/features/admin-pois/queries/admin-pois'
import { AdminPoiEditForm } from '@/features/admin-pois/components/AdminPoiEditForm'
import { AdminPoiStatusActions } from '@/features/admin-pois/components/AdminPoiStatusActions'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function AdminPoiDetailPage({ params }: PageProps) {
  await getPageAdmin()
  const { id } = await params
  const [poi, options] = await Promise.all([
    getAdminPoi(id),
    getAdminPoiOptions(),
  ])

  if (!poi) notFound()

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
        <div>
          <Button asChild variant="ghost" className="mb-4 px-0 text-slate-300 hover:bg-transparent hover:text-white">
            <Link href={`/admin/pois?city_id=${poi.city.id}`}>
              <ArrowLeft className="h-4 w-4" />
              Retour aux POI
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">Fiche publiée</p>
            <Badge variant="outline" className="border-white/20 text-slate-200">{poi.status}</Badge>
            <Badge variant="outline" className="border-white/20 text-slate-200">slug verrouillé</Badge>
          </div>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">{poi.name}</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-400">
            {poi.city.name} · {poi.category.name}{poi.subcategory ? ` · ${poi.subcategory.name}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={poi.public_url}>
              <ExternalLink className="h-4 w-4" />
              Voir public
            </Link>
          </Button>
          <AdminPoiStatusActions
            poiId={poi.id}
            status={poi.status}
            merchantAttached={poi.merchant_attached}
          />
        </div>
      </div>

      <AdminPoiEditForm poi={poi} categories={options.categories} />
    </div>
  )
}
