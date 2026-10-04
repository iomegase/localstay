import { prisma } from '@/shared/lib/prisma'

export class GoogleReviewPublicationError extends Error {
  constructor(
    public readonly code: 'REVIEW_NOT_FOUND' | 'DESTINATION_NOT_FOUND' | 'REVIEW_HAS_NO_TEXT',
    public readonly status: 404 | 422,
  ) {
    super(code)
    this.name = 'GoogleReviewPublicationError'
  }
}

const stayDateFormat = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })

export function frenchStayDate(date: Date): string {
  return stayDateFormat.format(date)
}

/** Spec 062 AC-02-03 : l'ensemble envoyé devient l'ensemble exact des destinations publiées. */
export async function setGoogleReviewPublications(
  reviewId: string,
  destinationIds: string[],
): Promise<{ google_review_id: string; published_destination_ids: string[] }> {
  const ids = [...new Set(destinationIds)]
  return prisma.$transaction(async tx => {
    const review = await tx.googleBusinessReview.findFirst({
      where: { id: reviewId, deleted_at: null },
      select: { google_review_id: true, author: true, rating: true, comment: true, google_created_at: true },
    })
    if (!review) throw new GoogleReviewPublicationError('REVIEW_NOT_FOUND', 404)
    if (ids.length > 0 && !review.comment) throw new GoogleReviewPublicationError('REVIEW_HAS_NO_TEXT', 422)

    const destinations = ids.length === 0 ? [] : await tx.localLandingDestination.findMany({
      where: { id: { in: ids }, is_active: true, deleted_at: null, city: { is_active: true, deleted_at: null } },
      select: { id: true, city: { select: { slug: true } } },
    })
    if (destinations.length !== ids.length) throw new GoogleReviewPublicationError('DESTINATION_NOT_FOUND', 404)

    await tx.localLandingReview.updateMany({
      where: { google_review_id: review.google_review_id, destination_id: { notIn: ids }, is_active: true },
      data: { is_active: false },
    })
    const content = {
      author: review.author,
      quote: review.comment ?? '',
      rating: review.rating,
      stay_date: frenchStayDate(review.google_created_at),
    }
    for (const destination of destinations) {
      await tx.localLandingReview.upsert({
        where: { destination_id_google_review_id: { destination_id: destination.id, google_review_id: review.google_review_id } },
        create: {
          destination_id: destination.id,
          destination_slug: destination.city.slug,
          google_review_id: review.google_review_id,
          source: 'GOOGLE',
          ...content,
          sort_order: 0,
          is_active: true,
          deleted_with_destination: false,
        },
        update: { destination_slug: destination.city.slug, ...content, is_active: true, deleted_at: null },
      })
    }
    return { google_review_id: review.google_review_id, published_destination_ids: ids }
  })
}
