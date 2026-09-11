'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, Pencil, Plus, RotateCcw, Star } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import type { AdminLandingPageDto, LandingReviewDto, LandingReviewSource } from '../types/landing-reviews'

type FormState = {
  author: string
  quote: string
  stay_date: string
  source: LandingReviewSource
  rating: string
  sort_order: string
}

const emptyForm: FormState = { author: '', quote: '', stay_date: '', source: 'DIRECT', rating: '', sort_order: '0' }

export function AdminLandingReviews({ selected, disabled = false, onPendingChange }: {
  selected: AdminLandingPageDto
  disabled?: boolean
  onPendingChange?: (pending: boolean) => void
}) {
  const router = useRouter()
  const prefix = useId()
  const selectedSlug = selected.slug
  const [editing, setEditing] = useState<LandingReviewDto | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const busy = pending || disabled

  function edit(review: LandingReviewDto) {
    setEditing(review)
    setForm({
      author: review.author,
      quote: review.quote,
      stay_date: review.stay_date ?? '',
      source: review.source,
      rating: review.rating?.toString() ?? '',
      sort_order: review.sort_order.toString(),
    })
    setMessage(null)
  }

  function reset() {
    setEditing(null)
    setForm(emptyForm)
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setPending(true)
    onPendingChange?.(true)
    setMessage(null)
    try {
      const response = await fetch(editing ? `/api/admin/landing-page-reviews/${editing.id}` : '/api/admin/landing-page-reviews', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination_slug: selectedSlug,
          author: form.author,
          quote: form.quote,
          stay_date: form.stay_date || null,
          source: form.source,
          rating: form.rating ? Number(form.rating) : null,
          sort_order: Number(form.sort_order),
        }),
      })
      if (!response.ok) {
        setMessage('Impossible d’enregistrer cet avis. Vérifiez les champs.')
        return
      }
      setMessage(editing ? 'Avis mis à jour et publié.' : 'Avis ajouté et publié.')
      reset()
      router.refresh()
    } catch {
      setMessage('Connexion impossible. Réessayez.')
    } finally {
      setPending(false)
      onPendingChange?.(false)
    }
  }

  async function changeArchiveState(review: LandingReviewDto) {
    if (busy) return
    setPending(true)
    onPendingChange?.(true)
    const restoring = Boolean(review.deleted_at)
    setMessage(null)
    try {
      const response = await fetch(`/api/admin/landing-page-reviews/${review.id}${restoring ? '/restore' : ''}`, {
        method: restoring ? 'POST' : 'DELETE',
      })
      setMessage(response.ok ? (restoring ? 'Avis restauré et publié.' : 'Avis archivé.') : 'Action impossible.')
      if (response.ok) router.refresh()
    } catch {
      setMessage('Connexion impossible. Réessayez.')
    } finally {
      setPending(false)
      onPendingChange?.(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-950">Avis de {selected.name}</h2>

      {selected && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-950">{editing ? 'Modifier l’avis' : 'Ajouter un avis'}</h2>
              {editing && <Button type="button" onClick={reset} className="text-xs font-semibold text-slate-500">Annuler</Button>}
            </div>
            <label className="block text-sm font-medium text-slate-700">Auteur
              <Input required minLength={2} maxLength={80} value={form.author} onChange={event => setForm({ ...form, author: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Avis
              <Textarea required minLength={10} maxLength={1200} rows={6} value={form.quote} onChange={event => setForm({ ...form, quote: event.target.value })} className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">Date du séjour
                <Input value={form.stay_date} maxLength={80} placeholder="Août 2026" onChange={event => setForm({ ...form, stay_date: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
              </label>
              <div className="space-y-2">
                <label htmlFor={`${prefix}-source`} className="block text-sm font-medium text-slate-700">Source</label>
                <Select value={form.source} onValueChange={value => setForm({ ...form, source: value as LandingReviewSource })}>
                  <SelectTrigger id={`${prefix}-source`}><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="DIRECT">Direct</SelectItem><SelectItem value="AIRBNB">Airbnb</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor={`${prefix}-rating`} className="block text-sm font-medium text-slate-700">Note</label>
                <Select value={form.rating || 'none'} onValueChange={value => setForm({ ...form, rating: value === 'none' ? '' : value })}>
                  <SelectTrigger id={`${prefix}-rating`}><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">Sans note</SelectItem>{[1, 2, 3, 4, 5].map(value => <SelectItem key={value} value={String(value)}>{value}/5</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <label className="block text-sm font-medium text-slate-700">Ordre
                <Input type="number" min={0} max={9999} required value={form.sort_order} onChange={event => setForm({ ...form, sort_order: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
              </label>
            </div>
            {message && <p role="status" className="text-sm text-slate-600">{message}</p>}
            <Button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1437] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
              {editing ? <Pencil size={16} /> : <Plus size={16} />}{pending ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Publier l’avis'}
            </Button>
          </form>

          <section className="space-y-3" aria-label={`Avis de ${selected.name}`}>
            {selected.reviews.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">Aucun avis pour cette ville.</div> : selected.reviews.map(review => (
              <article key={review.id} className={`rounded-2xl border border-slate-200 bg-white p-5 ${review.deleted_at ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div><h3 className="font-semibold text-slate-950">{review.author}</h3><p className="mt-1 text-xs text-slate-500">{review.source === 'AIRBNB' ? 'Airbnb' : 'Direct'}{review.stay_date ? ` · ${review.stay_date}` : ''} · ordre {review.sort_order}</p></div>
                  {review.rating && <span aria-label={`${review.rating} sur 5`} className="flex items-center gap-1 text-sm font-semibold text-amber-500"><Star size={15} fill="currentColor" />{review.rating}</span>}
                </div>
                <p className="mt-4 text-justify text-[13px] leading-6 text-slate-600">{review.quote}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {!review.deleted_at && <Button type="button" disabled={busy} onClick={() => edit(review)} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"><Pencil size={14} />Modifier</Button>}
                  <Button type="button" disabled={busy} onClick={() => changeArchiveState(review)} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">
                    {review.deleted_at ? <RotateCcw size={14} /> : <Archive size={14} />}{review.deleted_at ? 'Restaurer' : 'Archiver'}
                  </Button>
                </div>
              </article>
            ))}
          </section>
        </div>
      )}
    </div>
  )
}
