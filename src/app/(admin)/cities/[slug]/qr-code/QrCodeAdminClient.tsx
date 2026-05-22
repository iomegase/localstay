'use client'
import { useState } from 'react'

interface Props {
  citySlug: string
  adminSecret: string
}

export function QrCodeAdminClient({ citySlug, adminSecret }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRegenerate() {
    if (!confirm('Régénérer le QR code ? L\'ancien sera remplacé.')) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/cities/${citySlug}/qr-code`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminSecret}` },
      })
      if (!res.ok) throw new Error('Erreur serveur')
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleRegenerate}
        disabled={loading}
        data-testid="btn-regenerate"
        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50"
      >
        {loading ? 'Génération…' : 'Régénérer'}
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}
