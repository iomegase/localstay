'use client'

import { useId, useState } from 'react'
import { ArrowDown, ArrowUp, Bus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/shared/components/ui/dialog'
import { cityTransportCardsSchema, TRANSPORT_CARDS_MAX } from '@/features/transport/schemas'

type EditableCard = { key: string; id?: string; title: string; tag: string; body: string }
type ApiCard = { id: string; title: string; tag: string | null; body: string }

let keySequence = 0
const nextKey = () => `card-${++keySequence}`

/** Édition des cartes « Se déplacer » d'une ville (spec 055 AC-03-02). */
export function AdminCityTransportButton({ city }: { city: { slug: string; name: string } }) {
  const fieldId = useId()
  const [open, setOpen] = useState(false)
  const [cards, setCards] = useState<EditableCard[]>([])
  const [state, setState] = useState<'idle' | 'loading' | 'saving'>('idle')
  const [error, setError] = useState<string | null>(null)
  const endpoint = `/api/admin/cities/${encodeURIComponent(city.slug)}/transport-cards`

  async function changeOpen(next: boolean) {
    if (state === 'saving') return
    setOpen(next)
    if (!next) return
    setError(null)
    setState('loading')
    try {
      const response = await fetch(endpoint)
      if (!response.ok) throw new Error('load_failed')
      const payload = await response.json() as { data: ApiCard[] }
      setCards(payload.data.map(card => ({ key: nextKey(), id: card.id, title: card.title, tag: card.tag ?? '', body: card.body })))
    } catch {
      setError('Chargement impossible. Réessayez.')
    } finally {
      setState('idle')
    }
  }

  function update(index: number, patch: Partial<EditableCard>) {
    setCards(current => current.map((card, i) => (i === index ? { ...card, ...patch } : card)))
  }

  function move(index: number, offset: number) {
    setCards(current => {
      const target = index + offset
      if (target < 0 || target >= current.length) return current
      const next = current.slice()
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = cityTransportCardsSchema.safeParse({
      cards: cards.map(({ id, title, tag, body }) => ({ ...(id ? { id } : {}), title, tag, body })),
    })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }
    setState('saving')
    setError(null)
    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null
        setError(payload?.error?.message ?? 'Enregistrement impossible.')
        return
      }
      setOpen(false)
    } catch {
      setError('Erreur réseau. Réessayez.')
    } finally {
      setState('idle')
    }
  }

  const busy = state !== 'idle'

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-10 gap-2 rounded-xl border-gray-100 px-4 text-[13px] font-bold text-[#0B1437]">
          <Bus aria-hidden="true" />
          Transports
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl text-left whitespace-normal">
        <DialogHeader>
          <DialogTitle>Se déplacer — {city.name}</DialogTitle>
          <DialogDescription>
            Cartes affichées dans l&apos;écran « Se déplacer » du guide. N&apos;indiquez que des durées ou distances vérifiées.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" aria-busy={busy}>
          {state === 'loading' ? <p className="text-sm text-gray-500">Chargement…</p> : null}
          {cards.map((card, index) => (
            <fieldset key={card.key} className="space-y-3 rounded-2xl border border-gray-200 p-4">
              <legend className="sr-only">Carte {index + 1}</legend>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Carte {index + 1}</span>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="icon" aria-label={`Monter la carte ${index + 1}`} disabled={busy || index === 0} onClick={() => move(index, -1)}><ArrowUp /></Button>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Descendre la carte ${index + 1}`} disabled={busy || index === cards.length - 1} onClick={() => move(index, 1)}><ArrowDown /></Button>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Supprimer la carte ${index + 1}`} disabled={busy} onClick={() => setCards(current => current.filter((_, i) => i !== index))}><Trash2 /></Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                <div className="space-y-1.5">
                  <Label htmlFor={`${fieldId}-title-${card.key}`}>Titre</Label>
                  <Input id={`${fieldId}-title-${card.key}`} value={card.title} maxLength={80} placeholder="Tramway du Mont-Blanc" disabled={busy} onChange={event => update(index, { title: event.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${fieldId}-tag-${card.key}`}>Étiquette</Label>
                  <Input id={`${fieldId}-tag-${card.key}`} value={card.tag} maxLength={24} placeholder="Sur réservation" disabled={busy} onChange={event => update(index, { tag: event.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${fieldId}-body-${card.key}`}>Texte</Label>
                <Textarea id={`${fieldId}-body-${card.key}`} value={card.body} maxLength={400} rows={2} disabled={busy} onChange={event => update(index, { body: event.target.value })} />
              </div>
            </fieldset>
          ))}
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={busy || cards.length >= TRANSPORT_CARDS_MAX}
            onClick={() => setCards(current => [...current, { key: nextKey(), title: '', tag: '', body: '' }])}
          >
            <Plus aria-hidden="true" /> Ajouter une carte
          </Button>
          {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => changeOpen(false)} disabled={busy}>Annuler</Button>
            <Button type="submit" className="bg-[#0B1437] text-white" disabled={busy}>
              {state === 'saving' ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
