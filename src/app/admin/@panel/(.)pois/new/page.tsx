import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getManualPoiFormOptions } from '@/features/poi-acquisition/queries/manual-poi'
import { AdminPoiPanel } from '@/features/admin-pois/components/AdminPoiPanel'
import { AdminPoiCreatePanelForm } from '@/features/admin-pois/components/AdminPoiCreatePanelForm'
import { firstParam, type SearchParamsRecord } from '@/features/admin-pois/lib/list-filters'

type PageProps = {
  searchParams: Promise<SearchParamsRecord>
}

// Spec 068 US-05 : création d'un POI dans le panneau.
export default async function AdminPoiCreatePanelPage({ searchParams }: PageProps) {
  await getPageAdmin()
  const [listParams, options] = await Promise.all([searchParams, getManualPoiFormOptions()])

  return (
    <AdminPoiPanel
      title="Créer un POI"
      header={<p className="text-xs text-slate-500">Géocodage Mapbox et détection de doublon avant création.</p>}
      neighbors={null}
      sections={[]}
    >
      <div className="rounded-[24px] border border-slate-100 bg-white">
        <AdminPoiCreatePanelForm
          cities={options.cities}
          categories={options.categories}
          initialCityId={firstParam(listParams.city_id)}
          listParams={listParams}
        />
      </div>
    </AdminPoiPanel>
  )
}
