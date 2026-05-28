'use client'

import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { EditCandidateButton } from './EditCandidateButton'

type Props = {
  candidateId: string
  reviewStatus: string
  duplicatePoiIds: string[]
  geometryStatus: string
  editable: {
    title: string
    description: string | null
    difficulty: string | null
    start_label: string | null
    distance_km: number | null
    elevation_gain_m: number | null
    estimated_duration_min: number | null
  }
}

export function AdminTrailCandidateActions({ candidateId, reviewStatus, duplicatePoiIds, geometryStatus, editable }: Props) {
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
        <EditCandidateButton candidateId={candidateId} initial={editable} disabled={loading} />
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
        {geometryStatus !== 'valid' && (
          <UploadGpxButton
            candidateId={candidateId}
            disabled={loading}
            onUploaded={() => window.location.reload()}
          />
        )}
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

function UploadGpxButton({
  candidateId,
  disabled,
  onUploaded,
}: {
  candidateId: string
  disabled?: boolean
  onUploaded: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    const formData = new FormData()
    formData.append('gpx', file)
    try {
      const response = await fetch(`/api/admin/trails/candidates/${candidateId}/upload-gpx`, {
        method: 'POST',
        body: formData,
      })
      const json = await safeJson(response)
      if (!response.ok) {
        setError(errorMessage(json) ?? 'Upload GPX impossible.')
        return
      }
      onUploaded()
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-1 h-3.5 w-3.5" />
        {uploading ? 'Upload…' : 'Importer GPX'}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".gpx,application/gpx+xml,application/xml,text/xml"
        className="hidden"
        onChange={handleFile}
      />
      {error && <p className="w-full text-xs text-red-300">{error}</p>}
    </>
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
