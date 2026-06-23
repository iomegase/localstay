const mockFindFirst = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodgingFeaturedPoi: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
  },
}))

import { getContextualOwnerNote } from '@/features/guide-customization/queries/contextual-owner-note'

describe('AC-02-06: contextual Owner note', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns the normalized note for the exact lodging and POI', async () => {
    mockFindFirst.mockResolvedValue({ owner_note: '  Notre adresse préférée.  ' })

    await expect(getContextualOwnerNote('lodging-1', 'poi-1')).resolves.toBe(
      'Notre adresse préférée.',
    )
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: {
        lodging_id: 'lodging-1',
        poi_id: 'poi-1',
        deleted_at: null,
        lodging: { is_active: true, deleted_at: null },
        poi: { is_active: true, deleted_at: null },
      },
      select: { owner_note: true },
    })
  })

  it('returns null when the recommendation does not belong to the active lodging', async () => {
    mockFindFirst.mockResolvedValue(null)

    await expect(getContextualOwnerNote('lodging-other', 'poi-1')).resolves.toBeNull()
  })

  it.each([null, '', '   '])('returns null for an empty note: %p', async ownerNote => {
    mockFindFirst.mockResolvedValue({ owner_note: ownerNote })

    await expect(getContextualOwnerNote('lodging-1', 'poi-1')).resolves.toBeNull()
  })
})
