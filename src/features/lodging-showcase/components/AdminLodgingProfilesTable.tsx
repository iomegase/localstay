'use client'

import { Button } from '@/shared/components/ui/button'
import type { AdminLodgingProfileRow } from '../queries/admin-public-profiles'

export function AdminLodgingProfilesTable(props: { rows: AdminLodgingProfileRow[] }) {
  async function postAction(url: string, body?: Record<string, unknown>) {
    await fetch(url, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  if (props.rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-sm text-gray-500">
        Aucune fiche logement pour ce filtre.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-stone-50">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500">Logement</th>
              <th className="px-4 py-3 font-medium text-gray-500">Ville</th>
              <th className="px-4 py-3 font-medium text-gray-500">Owner</th>
              <th className="px-4 py-3 font-medium text-gray-500">Statut</th>
              <th className="px-4 py-3 font-medium text-gray-500">Photos</th>
              <th className="px-4 py-3 font-medium text-gray-500">Qualite SEO</th>
              <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {props.rows.map(row => (
              <tr key={row.id} className="border-t border-gray-100 align-top">
                <td className="px-4 py-4">
                  <div className="font-medium text-charcoal">{row.lodging.name}</div>
                  <div className="mt-1 text-xs text-gray-500">{row.short_description}</div>
                </td>
                <td className="px-4 py-4 text-gray-600">{row.city.name}</td>
                <td className="px-4 py-4 text-gray-600">{row.lodging.owner.email}</td>
                <td className="px-4 py-4">
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-charcoal">
                    {row.publication_status}
                  </span>
                </td>
                <td className="px-4 py-4 text-gray-600">{row.photos_count}</td>
                <td className="px-4 py-4">
                  {row.seo_warnings.length === 0 ? (
                    <span className="text-emerald-700">ok</span>
                  ) : (
                    <ul className="space-y-1 text-xs text-amber-700">
                      {row.seo_warnings.map(warning => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => postAction(`/api/admin/lodgings/public-profiles/${row.id}/publish`)}>
                      Publier
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => postAction(`/api/admin/lodgings/public-profiles/${row.id}/request-changes`, { admin_review_note: 'Ajouter des photos avec alt.' })}>
                      Corrections
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => postAction(`/api/admin/lodgings/public-profiles/${row.id}/archive`)}>
                      Archiver
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
