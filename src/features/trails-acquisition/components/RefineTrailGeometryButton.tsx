'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Route } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

/**
 * Déclenche un lot d'affinage de géométrie (snap/densification ORS foot-hiking) sur les
 * randos pas encore traitées. Même traitement que le cron quotidien, en manuel. Plan 2026-06-05.
 */
export function RefineTrailGeometryButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleRefine() {
    if (!confirm('Affiner un lot de tracés rando via ORS (snap sur le réseau de sentiers) ?')) return

    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/trails/refine-geometry', { method: 'POST' })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(body?.error?.message ?? 'Affinage impossible')
        return
      }
      const refined = body?.data?.refined ?? 0
      const processed = body?.data?.processed ?? 0
      const skipped = body?.data?.skipped ?? 0
      setMessage(`${refined}/${processed} tracés affinés (${skipped} ignorés).`)
      startTransition(() => router.refresh())
    } finally {
      setSubmitting(false)
    }
  }

  const disabled = pending || submitting

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleRefine}
        disabled={disabled}
        className="shrink-0 border-[#0B1437]/15 bg-white text-[#0B1437] hover:bg-gray-50"
      >
        <Route className="mr-1.5 h-3.5 w-3.5" />
        {submitting ? 'Affinage…' : 'Affiner les tracés (ORS)'}
      </Button>
      {message && <p className="text-xs text-emerald-600">{message}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
