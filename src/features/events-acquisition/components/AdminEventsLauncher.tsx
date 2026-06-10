'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Summary {
  fetched: number
  matched: number
  upserted: number
  skipped: number
  deleted: number
}

const DEFAULT_RADIUS_KM = 10
const MIN_RADIUS_KM = 1
const MAX_RADIUS_KM = 50

export function AdminEventsLauncher() {
  const router = useRouter()
  const [commune, setCommune] = useState('')
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onFetch() {
    setLoading(true)
    setError(null)
    setSummary(null)
    try {
      const res = await fetch('/api/admin/events/fetch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ commune, radiusKm }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error?.message ?? 'Erreur lors de la récupération')
        return
      }
      setSummary(json.data as Summary)
      router.refresh()
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200/60 bg-white p-4 space-y-3">
      <div className="flex gap-2">
        <input
          value={commune}
          onChange={(e) => setCommune(e.target.value)}
          placeholder="Commune ou code INSEE (ex : Chamonix, 74056)"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          <span className="whitespace-nowrap">Rayon</span>
          <input
            type="number"
            min={MIN_RADIUS_KM}
            max={MAX_RADIUS_KM}
            value={radiusKm}
            onChange={(e) =>
              setRadiusKm(Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, Number(e.target.value) || DEFAULT_RADIUS_KM)))
            }
            aria-label="Rayon de recherche en kilomètres"
            className="w-20 rounded-lg border border-gray-300 px-2 py-2 text-sm"
          />
          <span className="text-gray-400">km</span>
        </label>
        <button
          onClick={onFetch}
          disabled={loading || commune.trim().length === 0}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Récupération…' : 'Fetcher'}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      {summary && (
        <p className="text-sm text-emerald-700">
          {summary.upserted} événement(s) mis à jour, {summary.deleted} périmé(s) supprimé(s).
        </p>
      )}
    </div>
  )
}
