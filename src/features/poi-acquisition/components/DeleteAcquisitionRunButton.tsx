'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export function DeleteAcquisitionRunButton({
  runId,
  label,
}: {
  runId: string
  label: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    if (!confirm(`Supprimer définitivement le run "${label}" et tous ses candidats ?`)) return

    setSubmitting(true)
    setError(null)
    const response = await fetch(`/api/admin/poi-acquisition/runs/${runId}`, { method: 'DELETE' })
    setSubmitting(false)

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      setError(body?.error?.message ?? 'Suppression impossible')
      return
    }

    startTransition(() => router.refresh())
  }

  const disabled = pending || submitting

  return (
    <div className="flex flex-col items-stretch gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={disabled}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-100 bg-white py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
      >
        <Trash2 size={14} />
        {submitting ? 'Suppression…' : 'Effacer'}
      </button>
      {error && <p className="px-1 text-xs text-rose-600">{error}</p>}
    </div>
  )
}
