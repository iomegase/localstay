'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

export function DeleteRunButton({ runId, cityName }: { runId: string; cityName: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (!confirm(`Supprimer définitivement le run "${cityName}" et tous ses candidats ?`)) return

    setError(null)
    const response = await fetch(`/api/admin/trails/import-runs/${runId}`, { method: 'DELETE' })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      setError(body?.error?.message ?? 'Suppression impossible')
      return
    }

    startTransition(() => router.refresh())
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDelete}
        disabled={pending}
        className="shrink-0 border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 className="mr-1 h-3.5 w-3.5" />
        Effacer
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
