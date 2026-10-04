import { prisma } from '@/shared/lib/prisma'
import type { GoogleReviewStore } from '../services/sync'

const storedSelect = {
  google_review_id: true, author: true, author_photo_url: true, rating: true, comment: true, owner_reply: true,
  google_created_at: true, google_updated_at: true, deleted_at: true,
} as const

export const prismaGoogleReviewStore: GoogleReviewStore = {
  listAll: () => prisma.googleBusinessReview.findMany({ select: storedSelect }),

  async create(review, syncedAt) {
    await prisma.googleBusinessReview.create({ data: { ...review, last_synced_at: syncedAt } })
  },

  async update(review, syncedAt) {
    await prisma.$transaction(async tx => {
      await tx.googleBusinessReview.update({
        where: { google_review_id: review.google_review_id },
        data: { ...review, deleted_at: null, last_synced_at: syncedAt },
      })
      // Spec 062 AC-02-04 : les publications suivent le texte Google ; sans texte, elles sont retirées.
      await tx.localLandingReview.updateMany({
        where: { google_review_id: review.google_review_id },
        data: review.comment
          ? { quote: review.comment, rating: review.rating, author: review.author }
          : { is_active: false, rating: review.rating, author: review.author },
      })
    })
  },

  async markSynced(googleReviewIds, syncedAt) {
    if (googleReviewIds.length === 0) return
    await prisma.googleBusinessReview.updateMany({
      where: { google_review_id: { in: googleReviewIds } },
      data: { last_synced_at: syncedAt },
    })
  },

  async softDelete(googleReviewIds, deletedAt) {
    await prisma.$transaction(async tx => {
      await tx.googleBusinessReview.updateMany({
        where: { google_review_id: { in: googleReviewIds }, deleted_at: null },
        data: { deleted_at: deletedAt },
      })
      await tx.localLandingReview.updateMany({
        where: { google_review_id: { in: googleReviewIds } },
        data: { is_active: false },
      })
    })
  },
}
