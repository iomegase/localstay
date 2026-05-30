'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, MapPin, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

type Status = 'idle' | 'saving' | 'success' | 'error'

export function AdminCityCreateButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [department, setDepartment] = useState('')
  const [region, setRegion] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function reset() {
    setName('')
    setPostalCode('')
    setDepartment('')
    setRegion('')
    setStatus('idle')
    setMessage(null)
  }

  function closeAndReset() {
    setOpen(false)
    setTimeout(reset, 200)
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('saving')
    setMessage(null)

    try {
      const response = await fetch('/api/admin/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          postal_code: postalCode.trim(),
          department: department.trim() || undefined,
          region: region.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: { message?: string }
        } | null
        setStatus('error')
        setMessage(payload?.error?.message ?? 'Création impossible.')
        return
      }

      setStatus('success')
      setMessage('Ville créée. Géocodage Mapbox terminé.')
      router.refresh()
      setTimeout(() => closeAndReset(), 900)
    } catch {
      setStatus('error')
      setMessage('Erreur réseau. Réessayer.')
    }
  }

  const canSubmit = name.trim().length >= 2 && /^\d{5}$/.test(postalCode.trim()) && status !== 'saving'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0B1437] px-6 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-gray-900 hover:shadow-md"
      >
        <Plus size={16} className="transition-transform duration-300 group-hover:scale-110" />
        Ajouter une ville
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={closeAndReset}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="city-create-title"
            onClick={event => event.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-[25px] border border-gray-50 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3F4F8] text-[#0B1437]">
                  <MapPin size={20} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                    Nouvelle ville
                  </p>
                  <h2 id="city-create-title" className="text-base font-bold text-neutral-900">
                    Ajouter une ville
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={closeAndReset}
                aria-label="Fermer"
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#0B1437]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-5 p-6">
              <Field
                label="Nom"
                required
                value={name}
                onChange={setName}
                placeholder="Saint-Gervais-les-Bains"
                autoFocus
                maxLength={120}
              />

              <Field
                label="Code postal"
                required
                value={postalCode}
                onChange={value => setPostalCode(value.replace(/\D/g, '').slice(0, 5))}
                placeholder="74170"
                maxLength={5}
                hint="5 chiffres"
              />

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field
                  label="Département"
                  value={department}
                  onChange={setDepartment}
                  placeholder="Haute-Savoie"
                  maxLength={120}
                />
                <Field
                  label="Région"
                  value={region}
                  onChange={setRegion}
                  placeholder="Auvergne-Rhône-Alpes"
                  maxLength={120}
                />
              </div>

              <p className="rounded-xl border border-[#0B1437]/10 bg-[#F4F7FE]/40 px-3 py-2 text-[11px] text-[#0B1437]/80">
                Coordonnées GPS récupérées automatiquement via Mapbox à partir du nom + code postal.
              </p>

              {message && (
                <div
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-medium ${
                    status === 'error'
                      ? 'border-rose-100 bg-rose-50/60 text-rose-600'
                      : 'border-emerald-100 bg-emerald-50/60 text-emerald-600'
                  }`}
                >
                  {status === 'error' ? (
                    <AlertCircle size={14} className="shrink-0" />
                  ) : (
                    <CheckCircle2 size={14} className="shrink-0" />
                  )}
                  <span>{message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={closeAndReset}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-[12px] font-bold text-gray-600 transition-all hover:border-gray-300 hover:text-[#0B1437]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0B1437] px-5 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-gray-900 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'saving' ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Géocodage...
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Créer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  hint,
  maxLength,
  autoFocus,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  hint?: string
  maxLength?: number
  autoFocus?: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {hint && <span className="text-[10px] uppercase tracking-widest text-gray-300">{hint}</span>}
      </div>
      <div className="group relative">
        <input
          type="text"
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          maxLength={maxLength}
          className="peer w-full rounded-none border-0 border-b-2 border-gray-200 bg-white px-0 py-2.5 text-sm text-neutral-900 placeholder-gray-300 shadow-none transition-colors focus:outline-none focus:ring-0"
        />
        <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#0B1437] transition-all duration-300 ease-out group-hover:w-full peer-focus:w-full" />
      </div>
    </div>
  )
}
