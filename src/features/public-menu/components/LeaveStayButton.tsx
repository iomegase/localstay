'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export function LeaveStayButton() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    if (!confirm('Quitter votre séjour ? Le mode logement personnalisé sera désactivé jusqu\'au prochain scan de votre QR code.')) {
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/public/lodging-session', { method: 'DELETE' })
      if (!response.ok) {
        setError('Impossible de quitter le séjour pour le moment')
        return
      }
      startTransition(() => {
        router.replace('/')
        router.refresh()
      })
    } finally {
      setSubmitting(false)
    }
  }

  const isBusy = submitting || pending

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isBusy}
        className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-gray-500 transition-colors hover:border-red-200 hover:text-red-500 disabled:opacity-60"
      >
        <LogOut className="h-3.5 w-3.5" />
        {isBusy ? 'Sortie…' : 'Quitter le séjour'}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
