import { listActiveCities } from '@/features/city-guide/queries/cities'
import { prisma } from '@/shared/lib/prisma'

jest.mock('@/shared/lib/prisma', () => ({
  prisma: { city: { findMany: jest.fn() } },
}))

describe('listActiveCities', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns active, non-deleted cities ordered by name', async () => {
    ;(prisma.city.findMany as jest.Mock).mockResolvedValue([
      { name: 'Chamonix-Mont-Blanc', slug: 'chamonix-mont-blanc' },
      { name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' },
    ])

    const result = await listActiveCities()

    expect(prisma.city.findMany).toHaveBeenCalledWith({
      where: { is_active: true, deleted_at: null },
      orderBy: { name: 'asc' },
      select: { name: true, slug: true },
    })
    expect(result).toEqual([
      { name: 'Chamonix-Mont-Blanc', slug: 'chamonix-mont-blanc' },
      { name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' },
    ])
  })
})
