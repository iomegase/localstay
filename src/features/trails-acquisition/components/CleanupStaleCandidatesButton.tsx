'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

const THRESHOLD_DAYS = 3

export function CleanupStaleCandidatesButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCleanup() {
    if (
      !confirm(
        `Purger tous les candidats "needs_review" non publiés de plus de ${THRESHOLD_DAYS} jours (randonnées + POI) ?`,
      )
    ) {
      return
    }

    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/cleanup-stale-candidates', { method: 'POST' })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(body?.error?.message ?? 'Purge impossible')
        return
      }
      const trails = body?.data?.trail_candidates_purged ?? 0
      const pois = body?.data?.poi_candidates_purged ?? 0
      setMessage(`${trails} candidats rando + ${pois} candidats POI purgés (> ${THRESHOLD_DAYS} j).`)
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
        onClick={handleCleanup}
        disabled={disabled}
        className="shrink-0 border-amber-200 bg-white text-amber-700 hover:bg-amber-50 hover:text-amber-800"
      >
        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
        {submitting ? 'Purge…' : `Purger > ${THRESHOLD_DAYS} j`}
      </Button>
      {message && <p className="text-xs text-emerald-600">{message}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
