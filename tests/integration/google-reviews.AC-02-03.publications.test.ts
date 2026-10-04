const db = {
  googleBusinessReview: { findFirst: jest.fn() },
  localLandingDestination: { findMany: jest.fn() },
  localLandingReview: { updateMany: jest.fn(), upsert: jest.fn() },
}
jest.mock('@/shared/lib/prisma', () => ({ prisma: {
  $transaction: (callback: (tx: typeof db) => Promise<unknown>) => callback(db),
} }))

import {
  frenchStayDate, GoogleReviewPublicationError, setGoogleReviewPublications,
} from '@/features/google-reviews/queries/publications'

const REVIEW_ID = '7b0c6c1e-1f51-4f43-9b3b-2a8f8f3b9d10'
const SG = '0d1f6f9e-5a3c-4c47-8a1e-3a4b5c6d7e8f'
const SN = '1e2f3a4b-5c6d-4e7f-8a9b-0c1d2e3f4a5b'
const review = {
  id: REVIEW_ID, google_review_id: 'accounts/1/locations/2/reviews/a', author: 'Julie', rating: 5,
  comment: 'Séjour parfait.', google_created_at: new Date('2026-10-02T10:00:00Z'),
}

beforeEach(() => {
  jest.clearAllMocks()
  db.googleBusinessReview.findFirst.mockResolvedValue(review)
  const destinations = [
    { id: SG, city: { slug: 'saint-gervais-les-bains' } }, { id: SN, city: { slug: 'saint-nicolas-de-veroce' } },
  ]
  // Comme Prisma : ne renvoie que les destinations demandées.
  db.localLandingDestination.findMany.mockImplementation(async ({ where }: { where: { id: { in: string[] } } }) => (
    destinations.filter(destination => where.id.in.includes(destination.id))
  ))
})

describe('062 AC-02-03 — publier / dépublier', () => {
  it('upserts one active publication per checked destination and deactivates the others', async () => {
    const result = await setGoogleReviewPublications(REVIEW_ID, [SG, SN])

    expect(result).toEqual({ google_review_id: review.google_review_id, published_destination_ids: [SG, SN] })
    expect(db.localLandingReview.updateMany).toHaveBeenCalledWith({
      where: { google_review_id: review.google_review_id, destination_id: { notIn: [SG, SN] }, is_active: true },
      data: { is_active: false },
    })
    expect(db.localLandingReview.upsert).toHaveBeenCalledWith({
      where: { destination_id_google_review_id: { destination_id: SG, google_review_id: review.google_review_id } },
      create: {
        destination_id: SG, destination_slug: 'saint-gervais-les-bains', google_review_id: review.google_review_id,
        source: 'GOOGLE', author: 'Julie', quote: 'Séjour parfait.', rating: 5, stay_date: 'octobre 2026',
        sort_order: 0, is_active: true, deleted_with_destination: false,
      },
      update: {
        destination_slug: 'saint-gervais-les-bains', author: 'Julie', quote: 'Séjour parfait.', rating: 5,
        stay_date: 'octobre 2026', is_active: true, deleted_at: null,
      },
    })
    expect(db.localLandingReview.upsert).toHaveBeenCalledTimes(2)
  })

  it('an empty set unpublishes everywhere without upsert', async () => {
    expect(await setGoogleReviewPublications(REVIEW_ID, [])).toEqual({ google_review_id: review.google_review_id, published_destination_ids: [] })
    expect(db.localLandingReview.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { is_active: false } }))
    expect(db.localLandingReview.upsert).not.toHaveBeenCalled()
  })

  // Review Focus 5
  it('deduplicates destination ids so a double submit never creates two publications', async () => {
    await setGoogleReviewPublications(REVIEW_ID, [SG, SG])
    expect(db.localLandingReview.upsert).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['REVIEW_NOT_FOUND', 404, () => db.googleBusinessReview.findFirst.mockResolvedValue(null), [SG]],
    ['REVIEW_HAS_NO_TEXT', 422, () => db.googleBusinessReview.findFirst.mockResolvedValue({ ...review, comment: null }), [SG]],
    ['DESTINATION_NOT_FOUND', 404, () => db.localLandingDestination.findMany.mockResolvedValue([]), [SG]],
  ] as const)('rejects with %s (%s) and writes nothing', async (code, status, arrange, ids) => {
    arrange()
    await expect(setGoogleReviewPublications(REVIEW_ID, [...ids])).rejects.toEqual(new GoogleReviewPublicationError(code, status))
    expect(db.localLandingReview.upsert).not.toHaveBeenCalled()
    expect(db.localLandingReview.updateMany).not.toHaveBeenCalled()
  })

  it('formats the stay date in French in the Paris time zone', () => {
    expect(frenchStayDate(new Date('2026-10-31T23:30:00Z'))).toBe('novembre 2026')
  })
})
