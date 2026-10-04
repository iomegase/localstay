import { prisma } from '@/shared/lib/prisma'
import { googleBusinessConfigFromEnv } from '@/shared/lib/google-business'
import type { AdminGoogleReviewsData } from '../types'

export async function getAdminGoogleReviews(): Promise<AdminGoogleReviewsData> {
  const [reviews, destinations, lastSync] = await Promise.all([
    prisma.googleBusinessReview.findMany({
      where: { deleted_at: null },
      orderBy: { google_created_at: 'desc' },
      select: {
        id: true, google_review_id: true, author: true, author_photo_url: true, rating: true,
        comment: true, owner_reply: true, google_created_at: true,
        publications: { where: { is_active: true, deleted_at: null }, select: { destination_id: true } },
      },
    }),
    prisma.localLandingDestination.findMany({
      where: { is_active: true, deleted_at: null, city: { is_active: true, deleted_at: null } },
      orderBy: { city: { name: 'asc' } },
      select: { id: true, city: { select: { name: true } } },
    }),
    prisma.googleBusinessReview.aggregate({ _max: { last_synced_at: true } }),
  ])
  return {
    configured: googleBusinessConfigFromEnv() !== null,
    lastSyncedAt: lastSync._max.last_synced_at?.toISOString() ?? null,
    destinations: destinations.map(destination => ({ id: destination.id, name: destination.city.name })),
    reviews: reviews.map(({ publications, google_created_at, ...review }) => ({
      ...review,
      google_created_at: google_created_at.toISOString(),
      published_destination_ids: publications.map(publication => publication.destination_id),
    })),
  }
}
