'use client'

import { useRouter } from 'next/navigation'
import { AdminManualPoiForm } from '@/features/poi-acquisition/components/AdminManualPoiForm'
import { adminPoiPanelHref, type SearchParamsRecord } from '../lib/list-filters'
import { usePoiEditPanel } from './PoiEditPanelContext'

type Props = Omit<Parameters<typeof AdminManualPoiForm>[0], 'onCreated'> & {
  listParams: SearchParamsRecord
}

/** Spec 068 AC-05-02 : après création, le panneau affiche la fiche du nouveau POI. */
export function AdminPoiCreatePanelForm({ listParams, ...formProps }: Props) {
  const router = useRouter()
  const { markSaved } = usePoiEditPanel()

  return (
    <AdminManualPoiForm
      {...formProps}
      onCreated={poiId => {
        markSaved()
        router.replace(adminPoiPanelHref(poiId, listParams), { scroll: false })
        router.refresh()
      }}
    />
  )
}
