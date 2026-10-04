import type { NormalizedGoogleReview } from '@/shared/lib/google-business'
import { syncGoogleReviews, type GoogleReviewStore, type StoredGoogleReview } from '@/features/google-reviews/services/sync'

const now = new Date('2026-10-05T05:45:00Z')

const review = (id: string, overrides: Partial<NormalizedGoogleReview> = {}): NormalizedGoogleReview => ({
  google_review_id: `accounts/1/locations/2/reviews/${id}`,
  author: 'Julie', author_photo_url: null, rating: 5, comment: 'Parfait.', owner_reply: null,
  google_created_at: new Date('2026-09-01T10:00:00Z'), google_updated_at: new Date('2026-09-01T10:00:00Z'),
  ...overrides,
})

function memoryStore(initial: StoredGoogleReview[] = []) {
  const rows = new Map(initial.map(row => [row.google_review_id, { ...row }]))
  const calls = { create: 0, update: 0, softDelete: [] as string[], markSynced: [] as string[] }
  const store: GoogleReviewStore = {
    listAll: async () => [...rows.values()].map(row => ({ ...row })),
    create: async item => { calls.create += 1; rows.set(item.google_review_id, { ...item, deleted_at: null }) },
    update: async item => { calls.update += 1; rows.set(item.google_review_id, { ...item, deleted_at: null }) },
    markSynced: async ids => { calls.markSynced.push(...ids) },
    softDelete: async (ids, at) => {
      calls.softDelete.push(...ids)
      for (const id of ids) rows.set(id, { ...rows.get(id)!, deleted_at: at })
    },
  }
  return { store, rows, calls }
}

describe('062 AC-01-03 — upsert idempotent', () => {
  it('creates new reviews, then a second identical sync changes nothing', async () => {
    const { store, calls } = memoryStore()
    const fetchReviews = async () => [review('a'), review('b')]

    expect(await syncGoogleReviews({ fetchReviews, store, now: () => now })).toEqual({ fetched: 2, created: 2, updated: 0, deleted: 0 })
    expect(await syncGoogleReviews({ fetchReviews, store, now: () => now })).toEqual({ fetched: 2, created: 0, updated: 0, deleted: 0 })
    expect(calls.create).toBe(2)
    expect(calls.update).toBe(0)
  })

  it('updates a review whose content changed on Google and restores a previously deleted one', async () => {
    const { store, rows } = memoryStore([
      { ...review('a'), deleted_at: null },
      { ...review('b'), deleted_at: new Date('2026-09-20T00:00:00Z') },
    ])
    const summary = await syncGoogleReviews({
      fetchReviews: async () => [review('a', { comment: 'Parfait, merci !', google_updated_at: new Date('2026-10-01T00:00:00Z') }), review('b')],
      store, now: () => now,
    })
    expect(summary).toEqual({ fetched: 2, created: 0, updated: 2, deleted: 0 })
    expect(rows.get(review('a').google_review_id)?.comment).toBe('Parfait, merci !')
    expect(rows.get(review('b').google_review_id)?.deleted_at).toBeNull()
  })
})

describe('062 AC-01-04 — avis disparu de Google', () => {
  it('soft-deletes active reviews absent from the complete response', async () => {
    const { store, calls } = memoryStore([{ ...review('a'), deleted_at: null }, { ...review('gone'), deleted_at: null }])
    const summary = await syncGoogleReviews({ fetchReviews: async () => [review('a')], store, now: () => now })
    expect(summary).toEqual({ fetched: 1, created: 0, updated: 0, deleted: 1 })
    expect(calls.softDelete).toEqual([review('gone').google_review_id])
  })

  it('does not count an already deleted review again', async () => {
    const { store, calls } = memoryStore([{ ...review('a'), deleted_at: null }, { ...review('old'), deleted_at: now }])
    expect((await syncGoogleReviews({ fetchReviews: async () => [review('a')], store, now: () => now })).deleted).toBe(0)
    expect(calls.softDelete).toEqual([])
  })

  // Review Focus 3
  it('never deletes anything when Google returns zero review while active reviews exist', async () => {
    const { store, calls } = memoryStore([{ ...review('a'), deleted_at: null }])
    expect(await syncGoogleReviews({ fetchReviews: async () => [], store, now: () => now }))
      .toEqual({ fetched: 0, created: 0, updated: 0, deleted: 0 })
    expect(calls.softDelete).toEqual([])
  })
})

describe('062 AC-01-05 — erreur Google', () => {
  it('propagates the error without any write', async () => {
    const { store, calls } = memoryStore([{ ...review('a'), deleted_at: null }])
    await expect(syncGoogleReviews({
      fetchReviews: async () => { throw new Error('GOOGLE_API_ERROR') }, store, now: () => now,
    })).rejects.toThrow('GOOGLE_API_ERROR')
    expect(calls).toEqual({ create: 0, update: 0, softDelete: [], markSynced: [] })
  })
})

it('marks every fetched review as synced for the admin « dernière synchronisation » date', async () => {
  const { store, calls } = memoryStore([{ ...review('a'), deleted_at: null }])
  await syncGoogleReviews({ fetchReviews: async () => [review('a'), review('b')], store, now: () => now })
  expect(calls.markSynced.sort()).toEqual([review('a').google_review_id, review('b').google_review_id].sort())
})
