'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/shared/components/ui/button'
import { DeleteLodgingButton } from '@/features/admin/components/DeleteLodgingButton'
import type { AdminLodgingProfileRow } from '../queries/admin-public-profiles'

const seoWarningLabels: Record<string, string> = {
  public_profile_missing: 'Fiche publique absente',
  seo_photo_count: 'Ajouter au moins 5 photos',
  editorial_description_length: 'Description trop courte',
  seo_description_length: 'Description SEO a renforcer',
}

function formatSeoWarning(warning: string) {
  return seoWarningLabels[warning] ?? warning
}

export function AdminLodgingProfilesTable(props: { rows: AdminLodgingProfileRow[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function postAction(
    rowId: string,
    url: string,
    fallbackMessage: string,
    body?: Record<string, unknown>,
  ) {
    setBusyId(rowId)
    setError(null)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null

      if (!response.ok) {
        setError(payload?.error?.message ?? fallbackMessage)
        return
      }

      router.refresh()
    } catch {
      setError(fallbackMessage)
    } finally {
      setBusyId((current) => (current === rowId ? null : current))
    }
  }

  if (props.rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-sm text-gray-500">
        Aucune fiche logement pour ce filtre.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

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
              {props.rows.map(row => {
                const isBusy = busyId === row.id
                const profileId = row.profile_id

                return (
                  <tr key={row.id} className="border-t border-gray-100 align-top">
                    <td className="px-4 py-4">
                      <div className="font-medium text-charcoal">{row.lodging.name}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        {row.short_description || 'Fiche publique a preparer'}
                      </div>
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
                            <li key={warning}>{formatSeoWarning(warning)}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline" disabled={isBusy}>
                          <Link href={`/admin/lodgings/${row.lodging.id}/edit`}>Éditer</Link>
                        </Button>
                        {profileId && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isBusy}
                              onClick={() => void postAction(
                                row.id,
                                `/api/admin/lodgings/public-profiles/${profileId}/publish`,
                                'Publication impossible.',
                              )}
                            >
                              Publier
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isBusy}
                              onClick={() => void postAction(
                                row.id,
                                `/api/admin/lodgings/public-profiles/${profileId}/request-changes`,
                                'Demande de correction impossible.',
                                { admin_review_note: 'Ajouter des photos avec alt.' },
                              )}
                            >
                              Corrections
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isBusy}
                              onClick={() => void postAction(
                                row.id,
                                `/api/admin/lodgings/public-profiles/${profileId}/archive`,
                                'Archivage impossible.',
                              )}
                            >
                              Archiver
                            </Button>
                          </>
                        )}
                        <DeleteLodgingButton lodgingId={row.lodging.id} name={row.lodging.name} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
