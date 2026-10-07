import { notFound } from 'next/navigation'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getAdminPoi, getAdminPoiOptions, listAdminPoiIds } from '@/features/admin-pois/queries/admin-pois'
import { AdminPoiPanel } from '@/features/admin-pois/components/AdminPoiPanel'
import { AdminPoiPanelHeader } from '@/features/admin-pois/components/AdminPoiPanelHeader'
import { AdminPoiEditorBody } from '@/features/admin-pois/components/AdminPoiEditorBody'
import {
  buildAdminPoiListFilters,
  firstParam,
  panelNeighbors,
  type SearchParamsRecord,
} from '@/features/admin-pois/lib/list-filters'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchParamsRecord>
}

// Spec 068 US-01 : fiche POI dans le panneau, ouverte depuis la liste.
export default async function AdminPoiPanelPage({ params, searchParams }: PageProps) {
  await getPageAdmin()
  const [{ id }, listParams] = await Promise.all([params, searchParams])
  const [poi, options] = await Promise.all([getAdminPoi(id), getAdminPoiOptions()])
  if (!poi) notFound()

  const cityId = firstParam(listParams.city_id) ?? poi.city.id
  const ids = await listAdminPoiIds(buildAdminPoiListFilters(cityId, listParams))
  const sections = [
    { id: 'poi-section-identite', label: 'Identité' },
    { id: 'poi-section-lieu', label: 'Lieu' },
    { id: 'poi-section-photos', label: 'Photos' },
    { id: 'poi-section-publication', label: 'Publication' },
    ...(poi.trail_detail ? [{ id: 'poi-section-randonnee', label: 'Randonnée' }] : []),
  ]

  return (
    <AdminPoiPanel
      title={poi.name}
      header={<AdminPoiPanelHeader poi={poi} />}
      neighbors={panelNeighbors(ids, poi.id, listParams)}
      sections={sections}
    >
      <AdminPoiEditorBody key={poi.id} poi={poi} categories={options.categories} cities={options.cities} layout="panel" />
    </AdminPoiPanel>
  )
}
