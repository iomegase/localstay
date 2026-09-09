const mockFindMany = jest.fn()
const mockTransaction = jest.fn()
const mockFindReview = jest.fn()
const mockUpdateReview = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    localLandingReview: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findFirst: (...args: unknown[]) => mockFindReview(...args),
      update: (...args: unknown[]) => mockUpdateReview(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

import {
  archiveLandingReview, createLandingReview, listPublicLandingReviews, restoreLandingReview, updateLandingReview,
} from '@/features/local-seo/queries/landing-reviews'
import { landingReviewRow } from '../fixtures/local-landing-management'

const db = {
  localLandingDestination: { findFirst: jest.fn() },
  localLandingReview: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
}

const input = {
  destination_slug: 'chamonix-mont-blanc', author: 'Marie',
  quote: 'Un séjour parfaitement accompagné par MyStay.', source: 'DIRECT' as const, sort_order: 0,
}

describe('047 public landing reviews query', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindMany.mockResolvedValue([])
    mockTransaction.mockImplementation(async (callback: (tx: typeof db) => Promise<unknown>) => callback(db))
    db.localLandingDestination.findFirst.mockResolvedValue({ id: 'destination-2', city: { slug: 'chamonix-mont-blanc' } })
    db.localLandingReview.findFirst.mockResolvedValue({ id: 'review-1', destination_id: null })
    db.localLandingReview.create.mockResolvedValue({ ...landingReviewRow(), destination_id: 'destination-2', destination_slug: input.destination_slug })
    db.localLandingReview.update.mockResolvedValue({ ...landingReviewRow(), destination_id: 'destination-2', destination_slug: input.destination_slug })
  })

  it('filters visibility, orders deterministically and limits to three', async () => {
    await listPublicLandingReviews('saint-gervais-les-bains')
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        deleted_at: null, is_active: true, deleted_with_destination: false,
        destination: { is: {
          is_active: true, deleted_at: null,
          city: { slug: 'saint-gervais-les-bains', is_active: true, deleted_at: null },
        } },
      },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
      take: 3,
    }))
  })

  it('maps public data without leaking relation or archive fields', async () => {
    mockFindMany.mockResolvedValue([landingReviewRow()])
    expect(await listPublicLandingReviews('megeve')).toEqual([{
      id: 'review-1', author: 'Marie', quote: 'Un séjour parfaitement accompagné par MyStay.',
      stayDate: undefined, source: 'DIRECT', rating: 5,
    }])
  })

  it('creates a review for a persisted destination with both relation and compatibility slug', async () => {
    expect(await createLandingReview(input)).toMatchObject({ destination_id: 'destination-2', destination_slug: input.destination_slug })
    expect(db.localLandingDestination.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { is_active: true, deleted_at: null, city: { slug: input.destination_slug, is_active: true, deleted_at: null } },
    }))
    expect(db.localLandingReview.create).toHaveBeenCalledWith(expect.objectContaining({
      data: { ...input, destination_id: 'destination-2', stay_date: null, rating: null, deleted_with_destination: false },
    }))
    expect(mockTransaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' })
  })

  it('refuses review writes when the destination is unknown, archived or deleted', async () => {
    db.localLandingDestination.findFirst.mockResolvedValue(null)
    await expect(createLandingReview(input)).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    await expect(updateLandingReview('review-1', input)).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    expect(db.localLandingReview.create).not.toHaveBeenCalled()
    expect(db.localLandingReview.update).not.toHaveBeenCalled()
  })

  it('validates input before any database access', async () => {
    await expect(createLandingReview({ ...input, quote: 'x' })).rejects.toMatchObject({ name: 'ZodError' })
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('updates a legacy null relation only after resolving the active destination', async () => {
    await updateLandingReview('review-1', input)
    expect(db.localLandingReview.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'review-1' }, data: { ...input, destination_id: 'destination-2', stay_date: null, rating: null },
    }))
  })

  it('does not update a missing or deleted review', async () => {
    db.localLandingReview.findFirst.mockResolvedValue(null)
    await expect(updateLandingReview('unknown', input)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
    expect(db.localLandingReview.update).not.toHaveBeenCalled()
  })

  it('restoration requires an existing active destination relation and excludes legacy orphans', async () => {
    db.localLandingReview.findFirst.mockResolvedValue(null)
    await expect(restoreLandingReview('review-1')).rejects.toMatchObject({ code: 'NOT_FOUND' })
    expect(db.localLandingReview.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: 'review-1', deleted_at: { not: null }, deleted_with_destination: false,
        destination: { is: { is_active: true, deleted_at: null, city: { is_active: true, deleted_at: null } } },
      },
    }))
    expect(db.localLandingReview.update).not.toHaveBeenCalled()
  })

  it('preserves ordinary individual archive and restore without setting the group-deletion marker', async () => {
    const review = landingReviewRow()
    mockFindReview.mockResolvedValue({ id: review.id })
    mockUpdateReview.mockImplementation(async ({ data }: { data: Partial<typeof review> }) => Object.assign(review, data))
    const archived = await archiveLandingReview(review.id)
    expect(archived.deleted_at).not.toBeNull()
    expect(archived.is_active).toBe(false)
    expect(archived.deleted_with_destination).toBe(false)
    db.localLandingReview.findFirst.mockImplementation(async ({ where }: { where: { deleted_with_destination: boolean } }) => (
      review.deleted_with_destination === where.deleted_with_destination ? review : null
    ))
    db.localLandingReview.update.mockImplementation(async ({ data }: { data: Partial<typeof review> }) => Object.assign(review, data))
    const restored = await restoreLandingReview(review.id)
    expect(restored).toMatchObject({ deleted_at: null, is_active: true, deleted_with_destination: false })
  })
})
