'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, Pencil, Plus, RotateCcw, Star } from 'lucide-react'
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

export function AdminLandingPages({ initialPages }: { initialPages: AdminLandingPageDto[] }) {
  const router = useRouter()
  const [selectedSlug, setSelectedSlug] = useState(initialPages[0]?.slug ?? '')
  const [editing, setEditing] = useState<LandingReviewDto | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const selected = useMemo(() => initialPages.find(page => page.slug === selectedSlug), [initialPages, selectedSlug])

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
    setPending(true)
    setMessage(null)
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
    setPending(false)
    if (!response.ok) {
      setMessage('Impossible d’enregistrer cet avis. Vérifiez les champs.')
      return
    }
    setMessage(editing ? 'Avis mis à jour et publié.' : 'Avis ajouté et publié.')
    reset()
    router.refresh()
  }

  async function changeArchiveState(review: LandingReviewDto) {
    setPending(true)
    const restoring = Boolean(review.deleted_at)
    const response = await fetch(`/api/admin/landing-page-reviews/${review.id}${restoring ? '/restore' : ''}`, {
      method: restoring ? 'POST' : 'DELETE',
    })
    setPending(false)
    setMessage(response.ok ? (restoring ? 'Avis restauré et publié.' : 'Avis archivé.') : 'Action impossible.')
    if (response.ok) router.refresh()
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">SEO local</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Landing pages</h1>
        <p className="mt-2 text-sm text-slate-500">Gérez les avis affichés sur les pages conciergerie de chaque ville.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {initialPages.map(page => {
          const activeCount = page.reviews.filter(review => !review.deleted_at && review.is_active).length
          return (
            <button key={page.slug} type="button" onClick={() => { setSelectedSlug(page.slug); reset() }}
              className={`rounded-2xl border p-4 text-left transition ${selectedSlug === page.slug ? 'border-[#0B1437] bg-[#0B1437] text-white' : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'}`}>
              <span className="block text-sm font-semibold">{page.name}</span>
              <span className={`mt-2 block text-xs ${selectedSlug === page.slug ? 'text-slate-300' : 'text-slate-500'}`}>
                {page.published ? 'Landing publiée' : 'Landing non publiée'} · {activeCount} avis
              </span>
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-950">{editing ? 'Modifier l’avis' : 'Ajouter un avis'}</h2>
              {editing && <button type="button" onClick={reset} className="text-xs font-semibold text-slate-500">Annuler</button>}
            </div>
            <label className="block text-sm font-medium text-slate-700">Auteur
              <input required minLength={2} maxLength={80} value={form.author} onChange={event => setForm({ ...form, author: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Avis
              <textarea required minLength={10} maxLength={1200} rows={6} value={form.quote} onChange={event => setForm({ ...form, quote: event.target.value })} className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">Date du séjour
                <input value={form.stay_date} maxLength={80} placeholder="Août 2026" onChange={event => setForm({ ...form, stay_date: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
              </label>
              <label className="block text-sm font-medium text-slate-700">Source
                <select value={form.source} onChange={event => setForm({ ...form, source: event.target.value as LandingReviewSource })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm">
                  <option value="DIRECT">Direct</option><option value="AIRBNB">Airbnb</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">Note
                <select value={form.rating} onChange={event => setForm({ ...form, rating: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm">
                  <option value="">Sans note</option>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}/5</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">Ordre
                <input type="number" min={0} max={9999} required value={form.sort_order} onChange={event => setForm({ ...form, sort_order: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
              </label>
            </div>
            {message && <p role="status" className="text-sm text-slate-600">{message}</p>}
            <button disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1437] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
              {editing ? <Pencil size={16} /> : <Plus size={16} />}{pending ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Publier l’avis'}
            </button>
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
                  {!review.deleted_at && <button type="button" disabled={pending} onClick={() => edit(review)} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"><Pencil size={14} />Modifier</button>}
                  <button type="button" disabled={pending} onClick={() => changeArchiveState(review)} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">
                    {review.deleted_at ? <RotateCcw size={14} /> : <Archive size={14} />}{review.deleted_at ? 'Restaurer' : 'Archiver'}
                  </button>
                </div>
              </article>
            ))}
          </section>
        </div>
      )}
    </div>
  )
}
