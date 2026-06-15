'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function BlogDeleteButton({ id, title }: { id: string; title: string }) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const json = (await response.json().catch(() => null)) as { error?: { message?: string } } | null
        setError(json?.error?.message ?? 'Suppression impossible')
        return
      }
      setConfirmOpen(false)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="inline-flex items-center justify-center rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
      >
        Effacer
      </button>

      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirmer la suppression"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !busy && setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-6 shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-950">Effacer cet article ?</h2>
              <p className="text-sm text-slate-600">
                L’article « {title || 'Sans titre'} » sera retiré du blog et de la liste admin.
              </p>
              {error && <p className="text-sm text-rose-600">{error}</p>}
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={busy}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 disabled:opacity-60"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-rose-600 disabled:opacity-60"
              >
                {busy ? 'Suppression…' : 'Effacer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
