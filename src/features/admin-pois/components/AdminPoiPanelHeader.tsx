import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { AdminPoiDetail } from '../types'
import { AdminPoiStatusActions } from './AdminPoiStatusActions'

/** Spec 068 AC-01-04 : en-tête fixe du panneau (contexte, statuts, actions). */
export function AdminPoiPanelHeader({ poi }: { poi: AdminPoiDetail }) {
  const published = poi.discovery_status === 'PUBLISHED'

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-slate-500">
        {poi.city.name} · {poi.category.name}
        {poi.subcategory ? ` · ${poi.subcategory.name}` : ''}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
          {poi.status}
        </span>
        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${published ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
          {published ? 'Publié sur Découvrir' : 'Brouillon'}
        </span>
        {poi.public_url && (
          <Link
            href={poi.public_url}
            target="_blank"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:border-indigo-200 hover:text-indigo-700"
          >
            Voir public
            <ExternalLink aria-hidden="true" className="h-3 w-3" />
          </Link>
        )}
        <div className="[&_button]:h-7 [&_button]:rounded-lg [&_button]:px-2.5 [&_button]:text-[11px]">
          <AdminPoiStatusActions poiId={poi.id} status={poi.status} merchantAttached={poi.merchant_attached} />
        </div>
      </div>
    </div>
  )
}
