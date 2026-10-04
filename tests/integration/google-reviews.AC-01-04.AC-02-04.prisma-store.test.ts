const db = {
  googleBusinessReview: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  localLandingReview: { updateMany: jest.fn() },
}
const mockTransaction = jest.fn(async (callback: (tx: typeof db) => Promise<unknown>) => callback(db))
// Accesseurs paresseux : jest.mock est remonté au-dessus de `db`.
jest.mock('@/shared/lib/prisma', () => ({ prisma: {
  get googleBusinessReview() { return db.googleBusinessReview },
  get localLandingReview() { return db.localLandingReview },
  $transaction: (callback: (tx: typeof db) => Promise<unknown>) => mockTransaction(callback),
} }))

import { prismaGoogleReviewStore } from '@/features/google-reviews/queries/store'

const syncedAt = new Date('2026-10-05T05:45:00Z')
const item = {
  google_review_id: 'accounts/1/locations/2/reviews/a', author: 'Julie', author_photo_url: null, rating: 4,
  comment: 'Très bien.', owner_reply: null,
  google_created_at: new Date('2026-09-01T10:00:00Z'), google_updated_at: new Date('2026-10-01T10:00:00Z'),
}

beforeEach(() => jest.clearAllMocks())

describe('062 prisma store', () => {
  it('AC-02-04 — update rewrites the review and the quote / rating of its publications', async () => {
    await prismaGoogleReviewStore.update(item, syncedAt)
    expect(db.googleBusinessReview.update).toHaveBeenCalledWith({
      where: { google_review_id: item.google_review_id },
      data: { ...item, deleted_at: null, last_synced_at: syncedAt },
    })
    expect(db.localLandingReview.updateMany).toHaveBeenCalledWith({
      where: { google_review_id: item.google_review_id },
      data: { quote: 'Très bien.', rating: 4, author: 'Julie' },
    })
  })

  it('AC-02-04 — a review that lost its text unpublishes its publications', async () => {
    await prismaGoogleReviewStore.update({ ...item, comment: null }, syncedAt)
    expect(db.localLandingReview.updateMany).toHaveBeenCalledWith({
      where: { google_review_id: item.google_review_id },
      data: { is_active: false, rating: 4, author: 'Julie' },
    })
  })

  it('AC-01-04 — softDelete marks reviews deleted and deactivates their publications', async () => {
    await prismaGoogleReviewStore.softDelete([item.google_review_id], syncedAt)
    expect(db.googleBusinessReview.updateMany).toHaveBeenCalledWith({
      where: { google_review_id: { in: [item.google_review_id] }, deleted_at: null },
      data: { deleted_at: syncedAt },
    })
    expect(db.localLandingReview.updateMany).toHaveBeenCalledWith({
      where: { google_review_id: { in: [item.google_review_id] } },
      data: { is_active: false },
    })
  })

  it('create stores last_synced_at and markSynced only touches last_synced_at', async () => {
    await prismaGoogleReviewStore.create(item, syncedAt)
    expect(db.googleBusinessReview.create).toHaveBeenCalledWith({ data: { ...item, last_synced_at: syncedAt } })
    await prismaGoogleReviewStore.markSynced([item.google_review_id], syncedAt)
    expect(db.googleBusinessReview.updateMany).toHaveBeenCalledWith({
      where: { google_review_id: { in: [item.google_review_id] } },
      data: { last_synced_at: syncedAt },
    })
  })
})
