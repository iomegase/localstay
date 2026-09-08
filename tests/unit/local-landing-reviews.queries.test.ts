const mockFindMany = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: { localLandingReview: { findMany: (...args: unknown[]) => mockFindMany(...args) } },
}))

import { listPublicLandingReviews } from '@/features/local-seo/queries/landing-reviews'

describe('047 public landing reviews query', () => {
  it('filters visibility, orders deterministically and limits to three', async () => {
    mockFindMany.mockResolvedValue([])
    await listPublicLandingReviews('saint-gervais-les-bains')
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { destination_slug: 'saint-gervais-les-bains', deleted_at: null, is_active: true },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
      take: 3,
    }))
  })
})
