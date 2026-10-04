const findMany = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({ prisma: { localLandingReview: { findMany: (...args: unknown[]) => findMany(...args) } } }))

import { listPublicLandingReviews } from '@/features/local-seo/queries/landing-reviews'

it('062 AC-03-02 — only active, non-deleted publications reach the landing and keep their GOOGLE source', async () => {
  findMany.mockResolvedValue([{ id: 'p', quote: 'Parfait.', author: 'Julie', stay_date: 'octobre 2026', source: 'GOOGLE', rating: 5 }])
  const reviews = await listPublicLandingReviews('saint-gervais-les-bains')
  expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
    where: expect.objectContaining({ deleted_at: null, is_active: true, deleted_with_destination: false }),
  }))
  expect(reviews).toEqual([{ id: 'p', quote: 'Parfait.', author: 'Julie', stayDate: 'octobre 2026', source: 'GOOGLE', rating: 5 }])
})
