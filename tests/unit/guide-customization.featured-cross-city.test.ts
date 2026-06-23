jest.mock('@/shared/lib/prisma', () => ({
  prisma: { pointOfInterest: { findMany: jest.fn() } },
}))

import { prisma } from '@/shared/lib/prisma'
import { validateFeaturedPois } from '@/features/guide-customization/queries/customization'

const lodging = {
  id: 'l1',
  owner_id: 'o1',
  city_id: 'cityA',
  city: { latitude: 45, longitude: 6 },
}

function poiRow(id: string, city_id: string, category_id: string, over: Partial<{ is_active: boolean; deleted_at: Date | null }> = {}) {
  return { id, city_id, category_id, is_active: over.is_active ?? true, deleted_at: over.deleted_at ?? null }
}

describe('validateFeaturedPois — cross-city', () => {
  beforeEach(() => jest.clearAllMocks())

  it('accepts a POI from another city', async () => {
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue([poiRow('p1', 'cityB', 'cat1')] as never)
    const res = await validateFeaturedPois(lodging as never, [{ poi_id: 'p1', sort_order: 0 }])
    expect(res).toEqual([{ poi_id: 'p1', category_id: 'cat1', owner_note: null, sort_order: 0 }])
  })

  it('rejects more than 5 POIs in the same other city', async () => {
    const rows = Array.from({ length: 6 }, (_, i) => poiRow(`p${i}`, 'cityB', `c${i}`))
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue(rows as never)
    await expect(
      validateFeaturedPois(lodging as never, rows.map((r, i) => ({ poi_id: r.id, sort_order: i }))),
    ).rejects.toThrow(/ville/i)
  })

  it('still enforces 5 per category for local POIs', async () => {
    const rows = Array.from({ length: 6 }, (_, i) => poiRow(`p${i}`, 'cityA', 'cat1'))
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue(rows as never)
    await expect(
      validateFeaturedPois(lodging as never, rows.map((r, i) => ({ poi_id: r.id, sort_order: i }))),
    ).rejects.toThrow(/cat[ée]gorie/i)
  })

  it('rejects an inactive POI', async () => {
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue([poiRow('p1', 'cityB', 'c1', { is_active: false })] as never)
    await expect(
      validateFeaturedPois(lodging as never, [{ poi_id: 'p1', sort_order: 0 }]),
    ).rejects.toThrow(/indisponible/i)
  })
})
