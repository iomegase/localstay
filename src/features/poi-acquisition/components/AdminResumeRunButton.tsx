'use client'

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'

/** Spec 072 AC-02-01 : traite les lieux restants d'un lancement partiel. */
export function AdminResumeRunButton({ runId }: { runId: string }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function resume() {
    setPending(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/poi-acquisition/runs/${runId}/resume`, { method: 'POST' })
      if (!response.ok) {
        const json = await response.json().catch(() => null) as { error?: { message?: string } } | null
        setError(json?.error?.message ?? 'Reprise impossible.')
        return
      }
      window.location.reload()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button type="button" onClick={() => void resume()} disabled={pending} className="h-9 rounded-xl bg-[#0B1437] px-4 text-[12px] font-bold text-white">
        {pending ? 'Traitement… (jusqu’à 4 min)' : 'Reprendre'}
      </Button>
      {error && <p role="alert" className="text-[12px] font-semibold text-rose-600">{error}</p>}
    </div>
  )
}
