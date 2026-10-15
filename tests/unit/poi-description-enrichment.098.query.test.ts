const mockFindMany = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({ prisma: { pointOfInterest: { findMany: (...args: unknown[]) => mockFindMany(...args) } } }))

import { listDescriptionEnrichmentItems } from '@/features/admin-pois/queries/description-enrichment'

const row = (name: string, words: number) => ({
  id: name, name, slug: name.toLowerCase(), description: Array.from({ length: words }, () => 'mot').join(' '),
  city: { name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' }, category: { name: 'Restaurant', slug: 'diner' },
})

describe('098 AC-01-01 — POI publiés à description courte', () => {
  it('keeps published POIs under 120 words, shortest first, with their public path', async () => {
    mockFindMany.mockResolvedValue([row('B', 60), row('Long', 150), row('A', 20), row('Limite', 120)])
    const items = await listDescriptionEnrichmentItems()
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { deleted_at: null, is_active: true, discovery_status: 'PUBLISHED' } }))
    expect(items.map(item => [item.name, item.word_count])).toEqual([['A', 20], ['B', 60]])
    expect(items[0].public_path).toBe('/decouvrir/saint-gervais-les-bains/diner/a')
  })
})
