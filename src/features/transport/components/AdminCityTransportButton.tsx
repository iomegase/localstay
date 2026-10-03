'use client'

import { useId, useState } from 'react'
import { ArrowDown, ArrowUp, Bus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Switch } from '@/shared/components/ui/switch'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/shared/components/ui/dialog'
import { cityTransportCardsSchema, TRANSPORT_CARDS_MAX } from '@/features/transport/schemas'
import { ImageUpload } from '@/shared/components/ImageUpload'

type EditableCard = {
  key: string; id?: string; title: string; tag: string; body: string
  details: string; image_url: string; external_url: string; cta_label: string; poi_id: string; service_key: string; is_free: boolean
}
type ApiCard = Omit<EditableCard, 'key' | 'tag' | 'details' | 'image_url' | 'external_url' | 'cta_label' | 'poi_id' | 'service_key'> & {
  tag: string | null; details: string | null; image_url: string | null
  external_url: string | null; cta_label: string | null; poi_id: string | null; service_key: string | null
}

let keySequence = 0
const nextKey = () => `card-${++keySequence}`

/** Édition des cartes « Se déplacer » d'une ville (spec 055 AC-03-02). */
export function AdminCityTransportButton({ city }: { city: { slug: string; name: string } }) {
  const hasNativeShuttle = city.slug === 'saint-gervais-les-bains' || city.slug === 'saint-nicolas-de-veroce'
  const fieldId = useId()
  const [open, setOpen] = useState(false)
  const [cards, setCards] = useState<EditableCard[]>([])
  const [poiOptions, setPoiOptions] = useState<{ id: string; name: string }[]>([])
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
      const payload = await response.json() as { data: ApiCard[]; poiOptions?: { id: string; name: string }[] }
      setPoiOptions(payload.poiOptions ?? [])
      const savedCards = payload.data.map(card => ({
        key: nextKey(), id: card.id, title: card.title, tag: card.tag ?? '', body: card.body,
        details: card.details ?? '', image_url: card.image_url ?? '',
        external_url: card.external_url ?? '', cta_label: card.cta_label ?? '', poi_id: card.poi_id ?? '', service_key: card.service_key ?? '', is_free: card.is_free ?? false,
      }))
      if (hasNativeShuttle) {
        const shuttle = savedCards.find(card => card.service_key === 'facilibus') ?? {
          key: nextKey(), title: 'Navette gratuite', tag: '',
          body: 'Saint-Gervais ↔ Saint-Nicolas-de-Véroce · horaires et prochains passages',
          details: '', image_url: '', external_url: '', cta_label: '', poi_id: '',
          service_key: 'facilibus', is_free: true,
        }
        setCards([shuttle, ...savedCards.filter(card => card.service_key !== 'facilibus')])
      } else {
        setCards(savedCards)
      }
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
      cards: cards.map(({ id, title, tag, body, details, image_url, external_url, cta_label, poi_id, service_key, is_free }) => ({
        ...(id ? { id } : {}), title, tag, body, details, image_url, external_url, cta_label, poi_id, service_key, is_free,
      })),
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
            Si renseignée, la description courte reste visible ; les détails et actions s’ouvrent dans le guide. N’indiquez que des durées ou distances vérifiées.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" aria-busy={busy}>
          {state === 'loading' ? <p className="text-sm text-gray-500">Chargement…</p> : null}
          {cards.map((card, index) => (
            <fieldset key={card.key} className="space-y-3 rounded-2xl border border-gray-200 p-4">
              <legend className="sr-only">Carte {index + 1}</legend>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{card.service_key === 'facilibus' ? 'Navette gratuite' : `Carte ${index + 1}`}</span>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="icon" aria-label={`Monter la carte ${index + 1}`} disabled={busy || index === 0 || cards[index - 1]?.service_key === 'facilibus'} onClick={() => move(index, -1)}><ArrowUp /></Button>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Descendre la carte ${index + 1}`} disabled={busy || index === cards.length - 1 || card.service_key === 'facilibus'} onClick={() => move(index, 1)}><ArrowDown /></Button>
                  {card.service_key !== 'facilibus' ? <Button type="button" variant="ghost" size="icon" aria-label={`Supprimer la carte ${index + 1}`} disabled={busy} onClick={() => setCards(current => current.filter((_, i) => i !== index))}><Trash2 /></Button> : null}
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
              <div className="flex items-center gap-3">
                <Switch id={`${fieldId}-free-${card.key}`} checked={card.is_free} disabled={busy} onCheckedChange={checked => update(index, { is_free: checked })} />
                <Label htmlFor={`${fieldId}-free-${card.key}`}>Gratuit</Label>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${fieldId}-body-${card.key}`}>Description courte (facultative)</Label>
                <Textarea id={`${fieldId}-body-${card.key}`} value={card.body} maxLength={400} rows={2} disabled={busy} onChange={event => update(index, { body: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${fieldId}-details-${card.key}`}>Contenu détaillé de l’accordéon</Label>
                <Textarea id={`${fieldId}-details-${card.key}`} value={card.details} maxLength={3000} rows={4} disabled={busy} placeholder="Arrêts, conditions d’utilisation, conseils pratiques…" onChange={event => update(index, { details: event.target.value })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Image de la carte</Label>
                  {card.image_url ? (
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={card.image_url} alt="" className="h-16 w-16 rounded-xl object-cover" />
                      <Button type="button" variant="ghost" disabled={busy} onClick={() => update(index, { image_url: '' })}>Retirer</Button>
                    </div>
                  ) : null}
                  <ImageUpload endpoint={`/api/admin/cities/${encodeURIComponent(city.slug)}/transport-cards/image`} onUploaded={url => update(index, { image_url: url })} label="Importer une image" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${fieldId}-poi-${card.key}`}>Destination dans le guide</Label>
                  <select id={`${fieldId}-poi-${card.key}`} value={card.poi_id} disabled={busy} onChange={event => update(index, { poi_id: event.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Aucune</option>
                    {poiOptions.map(poi => <option key={poi.id} value={poi.id}>{poi.name}</option>)}
                  </select>
                  <p className="text-xs text-slate-500">Ouvre la fiche du lieu sans quitter le guide.</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`${fieldId}-url-${card.key}`}>URL externe (facultative)</Label>
                  <Input id={`${fieldId}-url-${card.key}`} type="url" value={card.external_url} disabled={busy} placeholder="https://…" onChange={event => update(index, { external_url: event.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${fieldId}-cta-${card.key}`}>Texte du bouton externe</Label>
                  <Input id={`${fieldId}-cta-${card.key}`} value={card.cta_label} maxLength={40} disabled={busy} placeholder="Voir les horaires" onChange={event => update(index, { cta_label: event.target.value })} />
                </div>
              </div>
            </fieldset>
          ))}
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={busy || cards.length >= TRANSPORT_CARDS_MAX}
            onClick={() => setCards(current => [...current, { key: nextKey(), title: '', tag: '', body: '', details: '', image_url: '', external_url: '', cta_label: '', poi_id: '', service_key: '', is_free: false }])}
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
