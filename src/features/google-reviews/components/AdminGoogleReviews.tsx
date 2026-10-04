'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Star } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import type { AdminGoogleReviewDto, AdminGoogleReviewsData, SyncSummary } from '../types'

const FILTERS = [
  { label: 'Toutes', match: () => true },
  { label: '5★', match: (rating: number) => rating === 5 },
  { label: '4★', match: (rating: number) => rating === 4 },
  { label: '3★ et moins', match: (rating: number) => rating <= 3 },
] as const

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' })
const dateTimeFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Paris' })

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count > 1 ? pluralForm : singular}`
}

function summaryMessage(summary: SyncSummary): string {
  return [
    plural(summary.fetched, 'avis lu', 'avis lus'),
    plural(summary.created, 'nouveau', 'nouveaux'),
    plural(summary.updated, 'mis à jour', 'mis à jour'),
    plural(summary.deleted, 'retiré', 'retirés'),
  ].join(' · ')
}

async function errorMessage(response: Response, fallback: string): Promise<string> {
  const body: unknown = await response.json().catch(() => null)
  if (typeof body === 'object' && body !== null && 'error' in body) {
    const error = (body as { error?: { message?: unknown } }).error
    if (typeof error?.message === 'string') return error.message
  }
  return fallback
}

export function AdminGoogleReviews({ initialData }: { initialData: AdminGoogleReviewsData }) {
  const router = useRouter()
  const [reviews, setReviews] = useState<AdminGoogleReviewDto[]>(initialData.reviews)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['label']>('Toutes')
  const [syncing, setSyncing] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const visible = useMemo(() => {
    const active = FILTERS.find(item => item.label === filter) ?? FILTERS[0]
    return [...reviews]
      .filter(review => active.match(review.rating))
      .sort((a, b) => b.google_created_at.localeCompare(a.google_created_at))
  }, [reviews, filter])

  async function sync() {
    setSyncing(true)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/google-reviews/sync', { method: 'POST' })
      if (!response.ok) {
        setMessage(await errorMessage(response, 'La synchronisation a échoué.'))
        return
      }
      setMessage(summaryMessage(await response.json() as SyncSummary))
      router.refresh()
    } catch {
      setMessage('La synchronisation a échoué.')
    } finally {
      setSyncing(false)
    }
  }

  async function toggle(review: AdminGoogleReviewDto, destinationId: string) {
    const previous = review.published_destination_ids
    const next = previous.includes(destinationId)
      ? previous.filter(id => id !== destinationId)
      : [...previous, destinationId]
    const apply = (ids: string[]) => setReviews(current => current.map(item => (
      item.id === review.id ? { ...item, published_destination_ids: ids } : item
    )))
    apply(next)
    setPendingId(review.id)
    setMessage(null)
    try {
      const response = await fetch(`/api/admin/google-reviews/${review.id}/publications`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ destination_ids: next }),
      })
      if (!response.ok) {
        apply(previous)
        setMessage(await errorMessage(response, 'La publication a échoué.'))
      }
    } catch {
      apply(previous)
      setMessage('La publication a échoué.')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Avis Google</h1>
          <p className="mt-1 text-sm text-slate-500">
            {initialData.lastSyncedAt
              ? `Dernière synchronisation : ${dateTimeFormat.format(new Date(initialData.lastSyncedAt))}`
              : 'Jamais synchronisé'}
          </p>
        </div>
        <Button type="button" onClick={sync} disabled={syncing || !initialData.configured} className="flex items-center gap-2">
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
          Synchroniser maintenant
        </Button>
      </header>

      {!initialData.configured && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Connexion Google non configurée</p>
          <p className="mt-1">Renseignez GOOGLE_BUSINESS_CLIENT_ID, GOOGLE_BUSINESS_CLIENT_SECRET, GOOGLE_BUSINESS_REFRESH_TOKEN, GOOGLE_BUSINESS_ACCOUNT_ID et GOOGLE_BUSINESS_LOCATION_ID (voir scripts/google-business-auth.ts).</p>
        </div>
      )}

      {message && <p role="status" className="text-sm text-slate-700">{message}</p>}

      <div className="flex flex-wrap gap-2" aria-label="Filtrer par note">
        {FILTERS.map(item => (
          <Button
            key={item.label}
            type="button"
            variant={filter === item.label ? 'default' : 'outline'}
            size="sm"
            aria-pressed={filter === item.label}
            onClick={() => setFilter(item.label)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
          Aucun avis importé. Lancez une synchronisation.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(review => (
            <article key={review.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {review.author_photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={review.author_photo_url} alt="" className="h-9 w-9 rounded-full object-cover" referrerPolicy="no-referrer" />
                  )}
                  <div>
                    <h2 className="font-semibold text-slate-950">{review.author}</h2>
                    <p className="text-xs text-slate-500">{dateFormat.format(new Date(review.google_created_at))}</p>
                  </div>
                </div>
                <span aria-label={`${review.rating} étoiles sur 5`} className="flex items-center gap-1 text-sm font-semibold text-amber-500">
                  <Star size={15} fill="currentColor" aria-hidden="true" />{review.rating}
                </span>
              </div>

              {review.comment
                ? <p className="mt-4 whitespace-pre-line text-[13px] leading-6 text-slate-600">{review.comment}</p>
                : <p className="mt-4 text-[13px] italic text-slate-400">Note sans commentaire</p>}

              {review.owner_reply && (
                <details className="mt-3 rounded-xl bg-slate-50 p-3 text-[13px] text-slate-600">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-700">Votre réponse</summary>
                  <p className="mt-2 whitespace-pre-line">{review.owner_reply}</p>
                </details>
              )}

              <fieldset className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4">
                <legend className="sr-only">Publication sur les landings</legend>
                {initialData.destinations.map(destination => (
                  <label key={destination.id} className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-pink-600"
                      checked={review.published_destination_ids.includes(destination.id)}
                      disabled={!review.comment || pendingId === review.id}
                      onChange={() => toggle(review, destination.id)}
                    />
                    Publié sur {destination.name}
                  </label>
                ))}
              </fieldset>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
