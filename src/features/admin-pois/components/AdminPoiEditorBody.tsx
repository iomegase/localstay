import type { AdminPoiCategory, AdminPoiDetail } from '../types'
import { AdminPoiDiscoveryCard } from './AdminPoiDiscoveryCard'
import { AdminPoiEditForm } from './AdminPoiEditForm'

/**
 * Spec 068 : contenu d'édition partagé par la pleine page et le panneau (aucune
 * duplication du formulaire).
 */
export function AdminPoiEditorBody({
  poi,
  categories,
  layout,
}: {
  poi: AdminPoiDetail
  categories: AdminPoiCategory[]
  layout: 'page' | 'panel'
}) {
  const discoveryCard = (
    <div id="poi-section-publication" className="scroll-mt-4">
      <AdminPoiDiscoveryCard
        poiId={poi.id}
        status={poi.discovery_status}
        publishedAt={poi.discovery_published_at}
        publicUrl={poi.discovery_public_url}
        eligibility={poi.discovery_eligibility}
      />
    </div>
  )

  if (layout === 'panel') {
    return (
      <div className="grid gap-6">
        <AdminPoiEditForm poi={poi} categories={categories} />
        {discoveryCard}
      </div>
    )
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-[24px] border border-slate-100 bg-white p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-slate-200">
        <AdminPoiEditForm poi={poi} categories={categories} />
      </div>
      <aside>{discoveryCard}</aside>
    </div>
  )
}
