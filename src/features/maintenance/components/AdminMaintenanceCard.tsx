'use client'

import { useState } from 'react'
import { ExternalLink, Wrench } from 'lucide-react'
import { Switch } from '@/shared/components/ui/switch'
import { DEFAULT_MAINTENANCE_MESSAGE, MAINTENANCE_MESSAGE_MAX, MAINTENANCE_PATH, type MaintenanceState } from '../lib/maintenance'

// Spec 087 AC-01-01 : interrupteur du mode maintenance dans le cockpit admin.
export function AdminMaintenanceCard({ initial }: { initial: MaintenanceState }) {
  const [saved, setSaved] = useState(initial)
  const [enabled, setEnabled] = useState(initial.enabled)
  const [message, setMessage] = useState(initial.message)
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const dirty = enabled !== saved.enabled || message.trim() !== saved.message

  async function save() {
    setPending(true)
    setFeedback(null)
    try {
      const response = await fetch('/api/admin/maintenance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, message: message.trim() || null }),
      })
      const payload = await response.json().catch(() => null) as { data?: MaintenanceState; error?: { message?: string } } | null
      if (!response.ok || !payload?.data) throw new Error(payload?.error?.message ?? 'Enregistrement impossible.')
      setSaved(payload.data)
      setEnabled(payload.data.enabled)
      setMessage(payload.data.message)
      setFeedback({ tone: 'ok', text: payload.data.enabled ? 'Site public en maintenance (effectif sous 15 s).' : 'Site public rouvert (effectif sous 15 s).' })
    } catch (error) {
      setFeedback({ tone: 'error', text: error instanceof Error ? error.message : 'Enregistrement impossible.' })
    } finally {
      setPending(false)
    }
  }

  return (
    <section aria-labelledby="maintenance-title" className={`mb-8 rounded-[25px] border bg-white p-6 shadow-sm sm:p-8 ${saved.enabled ? 'border-amber-200' : 'border-gray-50'}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${saved.enabled ? 'bg-amber-100 text-amber-700' : 'bg-[#F3F4F8] text-[#0B1437]'}`}>
            <Wrench size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 id="maintenance-title" className="text-base font-bold text-neutral-900">Mode maintenance</h2>
            <p className="mt-0.5 text-xs text-gray-500">Ferme le site public. Le guide des voyageurs, les espaces propriétaire et admin, et la connexion restent ouverts.</p>
          </div>
        </div>
        <span data-testid="maintenance-status" className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${saved.enabled ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>
          {saved.enabled ? 'Maintenance active' : 'Site ouvert'}
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start">
        <label className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3">
          <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Mettre le site public en maintenance" disabled={pending} />
          <span className="text-sm font-semibold text-neutral-900">{enabled ? 'Maintenance activée' : 'Maintenance désactivée'}</span>
        </label>
        <div className="space-y-1.5">
          <label htmlFor="maintenance-message" className="text-[13px] font-semibold text-gray-700">Message affiché aux visiteurs</label>
          <textarea
            id="maintenance-message"
            value={message}
            maxLength={MAINTENANCE_MESSAGE_MAX}
            rows={2}
            placeholder={DEFAULT_MAINTENANCE_MESSAGE}
            onChange={event => setMessage(event.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-neutral-900 focus:border-[#0B1437] focus:outline-none focus:ring-1 focus:ring-[#0B1437]"
          />
          <p className="text-[11px] text-gray-400">Vide : message par défaut. Affiché sous le logo MyStay, au centre de la page.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={pending || !dirty}
          className="inline-flex h-10 items-center rounded-xl bg-[#0B1437] px-5 text-[13px] font-bold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <a href={MAINTENANCE_PATH} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0B1437] hover:underline">
          Voir la page de maintenance <ExternalLink size={13} aria-hidden="true" />
        </a>
        {feedback ? (
          <p role="status" className={`text-[13px] font-semibold ${feedback.tone === 'ok' ? 'text-emerald-700' : 'text-rose-600'}`}>{feedback.text}</p>
        ) : null}
      </div>
    </section>
  )
}
