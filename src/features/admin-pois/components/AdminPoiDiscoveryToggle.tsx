'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Switch } from '@/shared/components/ui/switch'
import { DISCOVERY_CHECK_LABELS } from '../lib/discovery-check-labels'
import { parseAdminPoiDiscoveryMissingKeys } from '../lib/discovery-publication-response'
import type { AdminPoiDiscoveryStatus } from '../types'

const GENERIC_ERROR = 'Publication impossible, réessayez.'

function refusalMessage(payload: unknown): string {
  const missing = parseAdminPoiDiscoveryMissingKeys(payload)
  if (missing.length === 0) return GENERIC_ERROR
  const labels = DISCOVERY_CHECK_LABELS
    .filter(({ key }) => missing.includes(key))
    .map(({ label }) => label)
  return `Fiche incomplète : ${labels.join(', ')}`
}

/** Spec 068 US-06 : publier / retirer de Découvrir depuis la liste, sans ouvrir la fiche. */
export function AdminPoiDiscoveryToggle({
  poiId,
  name,
  status,
}: {
  poiId: string
  name: string
  status: AdminPoiDiscoveryStatus
}) {
  const router = useRouter()
  const [published, setPublished] = useState(status === 'PUBLISHED')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle(nextPublished: boolean) {
    if (pending) return
    setPending(true)
    setError(null)
    setPublished(nextPublished)
    try {
      const response = await fetch(`/api/admin/pois/${poiId}/discovery-publication`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextPublished ? 'PUBLISHED' : 'DRAFT' }),
      })
      const payload: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        setPublished(!nextPublished)
        setError(response.status === 409 ? refusalMessage(payload) : GENERIC_ERROR)
        return
      }
      router.refresh()
    } catch {
      setPublished(!nextPublished)
      setError(GENERIC_ERROR)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <label className="inline-flex items-center gap-2 text-[11px] font-semibold text-gray-500">
        <Switch
          checked={published}
          disabled={pending}
          onCheckedChange={checked => void toggle(checked)}
          aria-label={`${name} — Publié sur Découvrir`}
        />
        Découvrir
      </label>
      {error && (
        <p role="alert" className="max-w-[220px] whitespace-normal text-[10px] font-semibold leading-snug text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}
