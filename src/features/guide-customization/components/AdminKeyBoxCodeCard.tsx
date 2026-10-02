'use client'

import { useId, useState } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

/** Carte admin « Accès voyageurs » : code de boîte à clés masqué (spec 054 AC-05-04). */
export function AdminKeyBoxCodeCard({ lodgingId, initialCode }: { lodgingId: string; initialCode: string | null }) {
  const fieldId = useId()
  const [code, setCode] = useState(initialCode ?? '')
  const [shown, setShown] = useState(false)
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState('saving')
    setError(null)
    try {
      const response = await fetch(`/api/admin/lodgings/${lodgingId}/key-box-code`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key_box_code: code }),
      })
      const payload = await response.json().catch(() => null) as
        | { data?: { key_box_code: string | null }; error?: { message?: string } }
        | null
      if (!response.ok) {
        setError(payload?.error?.message ?? 'Enregistrement impossible.')
        setState('error')
        return
      }
      setCode(payload?.data?.key_box_code ?? '')
      setState('saved')
    } catch {
      setError('Erreur réseau. Réessayez.')
      setState('error')
    }
  }

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-500">Guide privé · Accès voyageurs</p>
      <h2 className="mt-2 flex items-center gap-2 text-xl font-light text-charcoal">
        <KeyRound className="h-5 w-5" aria-hidden="true" />
        Boîte à clés
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        Le code s&apos;affiche masqué (bouton « Afficher le code ») dans l&apos;étape de type « Accès » du parcours d&apos;arrivée, uniquement dans le guide privé.
      </p>
      <form onSubmit={save} className="mt-5 flex flex-wrap items-end gap-3" aria-busy={state === 'saving'}>
        <div className="min-w-[200px] flex-1 space-y-2">
          <Label htmlFor={fieldId}>Code de la boîte à clés</Label>
          <div className="relative">
            <Input
              id={fieldId}
              type={shown ? 'text' : 'password'}
              autoComplete="off"
              value={code}
              maxLength={20}
              placeholder="Aucun code"
              onChange={event => {
                setCode(event.target.value)
                setState('idle')
              }}
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShown(value => !value)}
              aria-label={shown ? 'Masquer le code' : 'Afficher le code'}
              className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center text-gray-500"
            >
              {shown ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="bg-[#0B1437] text-white" disabled={state === 'saving'} aria-label="Enregistrer le code">
          {state === 'saving' ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </form>
      {state === 'saved' ? <p role="status" className="mt-3 text-sm text-emerald-600">Code enregistré.</p> : null}
      {error ? <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p> : null}
    </section>
  )
}
