'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

type AdminCandidateReviewActionsProps = {
  candidateId: string
  reviewStatus: string
  duplicatePoiIds: string[]
}

export function AdminCandidateReviewActions({
  candidateId,
  reviewStatus,
  duplicatePoiIds,
}: AdminCandidateReviewActionsProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mergePoiId, setMergePoiId] = useState(duplicatePoiIds[0] ?? '')

  if (reviewStatus !== 'needs_review') {
    return null
  }

  async function postAction(path: string, body: Record<string, unknown>) {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await safeJson(response)
      if (!response.ok) {
        setError(errorMessage(json) ?? 'Action impossible.')
        return
      }
      window.location.reload()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 border-t border-white/10 pt-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={loading || duplicatePoiIds.length > 0}
          onClick={() => postAction(`/api/admin/poi-acquisition/candidates/${candidateId}/publish`, {
            confirm_duplicate: false,
          })}
        >
          Publier
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => postAction(`/api/admin/poi-acquisition/candidates/${candidateId}/reject`, {
            admin_note: 'Rejet manuel depuis la revue admin',
          })}
        >
          Rejeter
        </Button>
        <button
          type="button"
          aria-label="Exclure"
          title="Exclure : ne plus jamais proposer ce lieu dans cette ville"
          disabled={loading}
          onClick={() => {
            // Spec 071 US-03 : exclusion toutes catégories, réversible depuis la page Acquisition.
            if (!window.confirm('Exclure ce lieu ? Il ne sera plus proposé dans les acquisitions de cette ville, quelle que soit la catégorie (réversible depuis « Lieux exclus ou rejetés »).')) return
            void postAction(`/api/admin/poi-acquisition/candidates/${candidateId}/exclude`, {})
          }}
          className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
        >
          <Trash2 aria-hidden="true" size={14} strokeWidth={2.5} />
        </button>
      </div>
      {duplicatePoiIds.length > 0 && (
        <div className="flex flex-col gap-2 md:flex-row">
          <Input
            aria-label="POI existant pour fusion"
            value={mergePoiId}
            onChange={event => setMergePoiId(event.target.value)}
            className="bg-white text-slate-950"
            placeholder="ID du POI existant"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={loading || !mergePoiId}
            onClick={() => postAction(`/api/admin/poi-acquisition/candidates/${candidateId}/merge`, {
              poi_id: mergePoiId,
            })}
          >
            Fusionner
          </Button>
        </div>
      )}
      {duplicatePoiIds.length > 0 && (
        <p className="text-xs text-amber-200">
          Publication directe bloquée: fusionner avec un doublon ou traiter manuellement.
        </p>
      )}
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  )
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function errorMessage(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || !('error' in value)) return null
  const error = Reflect.get(value, 'error')
  if (typeof error !== 'object' || error === null || !('message' in error)) return null
  const message = Reflect.get(error, 'message')
  return typeof message === 'string' ? message : null
}
