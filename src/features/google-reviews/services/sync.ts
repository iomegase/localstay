import type { NormalizedGoogleReview } from '@/shared/lib/google-business'
import type { SyncSummary } from '../types'

export type StoredGoogleReview = NormalizedGoogleReview & { deleted_at: Date | null }

export type GoogleReviewStore = {
  listAll(): Promise<StoredGoogleReview[]>
  create(review: NormalizedGoogleReview, syncedAt: Date): Promise<void>
  update(review: NormalizedGoogleReview, syncedAt: Date): Promise<void>
  markSynced(googleReviewIds: string[], syncedAt: Date): Promise<void>
  softDelete(googleReviewIds: string[], deletedAt: Date): Promise<void>
}

function sameContent(stored: StoredGoogleReview, fetched: NormalizedGoogleReview): boolean {
  return stored.deleted_at === null
    && stored.author === fetched.author
    && stored.author_photo_url === fetched.author_photo_url
    && stored.rating === fetched.rating
    && stored.comment === fetched.comment
    && stored.owner_reply === fetched.owner_reply
    && stored.google_updated_at.getTime() === fetched.google_updated_at.getTime()
}

/**
 * Spec 062 AC-01-03 à AC-01-05 : Google d'abord (aucune écriture si l'appel échoue),
 * puis création / mise à jour par google_review_id et soft delete des avis disparus.
 */
export async function syncGoogleReviews({ fetchReviews, store, now = () => new Date() }: {
  fetchReviews: () => Promise<NormalizedGoogleReview[]>
  store: GoogleReviewStore
  now?: () => Date
}): Promise<SyncSummary> {
  const fetched = await fetchReviews()
  const syncedAt = now()
  const existing = new Map((await store.listAll()).map(review => [review.google_review_id, review]))
  let created = 0
  let updated = 0

  for (const review of fetched) {
    const stored = existing.get(review.google_review_id)
    if (!stored) {
      await store.create(review, syncedAt)
      created += 1
    } else if (!sameContent(stored, review)) {
      await store.update(review, syncedAt)
      updated += 1
    }
  }
  await store.markSynced(fetched.map(review => review.google_review_id), syncedAt)

  const fetchedIds = new Set(fetched.map(review => review.google_review_id))
  const missing = [...existing.values()]
    .filter(review => review.deleted_at === null && !fetchedIds.has(review.google_review_id))
    .map(review => review.google_review_id)
  // Garde-fou : une réponse vide signale plus probablement une mauvaise configuration qu'une fiche vidée.
  const deletable = fetched.length === 0 ? [] : missing
  if (deletable.length > 0) await store.softDelete(deletable, syncedAt)

  return { fetched: fetched.length, created, updated, deleted: deletable.length }
}
