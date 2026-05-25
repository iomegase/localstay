'use client'

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

type Props = {
  candidateId: string
  reviewStatus: string
  duplicatePoiIds: string[]
  geometryStatus: string
}

export function AdminTrailCandidateActions({ candidateId, reviewStatus, duplicatePoiIds, geometryStatus }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mergePoiId, setMergePoiId] = useState(duplicatePoiIds[0] ?? '')

  if (reviewStatus !== 'needs_review') return null

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
        setError(errorMessage(json) ?? 'Action randonnée impossible.')
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
          disabled={loading || duplicatePoiIds.length > 0 || geometryStatus !== 'valid'}
          onClick={() => postAction(`/api/admin/trails/candidates/${candidateId}/publish`, {
            confirm_duplicate: false,
            confirm_incomplete_geometry: false,
          })}
        >
          Publier
        </Button>
        {geometryStatus !== 'valid' && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={loading || duplicatePoiIds.length > 0}
            onClick={() => postAction(`/api/admin/trails/candidates/${candidateId}/publish`, {
              confirm_duplicate: false,
              confirm_incomplete_geometry: true,
            })}
          >
            Publier incomplet
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => postAction(`/api/admin/trails/candidates/${candidateId}/reject`, {
            admin_note: 'Rejet manuel depuis la revue randonnée',
          })}
        >
          Rejeter
        </Button>
      </div>

      {duplicatePoiIds.length > 0 && (
        <div className="flex flex-col gap-2 md:flex-row">
          <Input
            aria-label="Randonnée existante pour fusion"
            value={mergePoiId}
            onChange={event => setMergePoiId(event.target.value)}
            className="bg-white text-slate-950"
            placeholder="ID du POI randonnée existant"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={loading || !mergePoiId}
            onClick={() => postAction(`/api/admin/trails/candidates/${candidateId}/merge`, {
              poi_id: mergePoiId,
            })}
          >
            Fusionner
          </Button>
        </div>
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
