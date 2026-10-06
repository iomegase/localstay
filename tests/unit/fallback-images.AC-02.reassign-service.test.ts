const mockPoiFindMany = jest.fn()
const mockPoiUpdate = jest.fn()
const mockImageFindMany = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    pointOfInterest: {
      findMany: (...args: unknown[]) => mockPoiFindMany(...args),
      update: (...args: unknown[]) => mockPoiUpdate(...args),
    },
    fallbackImage: { findMany: (...args: unknown[]) => mockImageFindMany(...args) },
  },
}))

import { reassignFallbackImages } from '@/features/fallback-images/services/reassign'

// Spec 070 US-02 — application des attributions en base.
function row(id: string, photos: string[], fallback_image_id: string | null = null, city_id = 'sg') {
  return { id, city_id, category_id: 'shop', subcategory_id: 'ski', photos, fallback_image_id }
}

describe('070 — reassignFallbackImages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockImageFindMany.mockResolvedValue([
      { id: 'ski-1', category_id: 'shop', subcategory_id: 'ski', created_at: new Date('2026-10-01') },
      { id: 'ski-2', category_id: 'shop', subcategory_id: 'ski', created_at: new Date('2026-10-02') },
    ])
    mockPoiUpdate.mockResolvedValue({})
  })

  it('cible les POI demandés et compte l’usage sur toute leur ville', async () => {
    mockPoiFindMany
      .mockResolvedValueOnce([row('a', [])])
      .mockResolvedValueOnce([row('a', []), row('x', [], 'ski-1')])

    const result = await reassignFallbackImages({ poiIds: ['a'] })

    expect(mockPoiFindMany.mock.calls[0]![0].where).toMatchObject({ id: { in: ['a'] }, deleted_at: null, is_active: true })
    expect(mockPoiFindMany.mock.calls[1]![0].where).toMatchObject({ city_id: { in: ['sg'] }, deleted_at: null, is_active: true })
    expect(mockImageFindMany.mock.calls[0]![0].where).toEqual({ deleted_at: null, category_id: { not: null } })
    expect(mockPoiUpdate).toHaveBeenCalledTimes(1)
    expect(mockPoiUpdate).toHaveBeenCalledWith({ where: { id: 'a' }, data: { fallback_image_id: 'ski-2' } })
    expect(result).toEqual({ examined: 1, updated: 1 })
  })

  it('sans périmètre : tous les POI actifs, une seule lecture', async () => {
    mockPoiFindMany.mockResolvedValueOnce([row('a', ['https://example.com/photo.jpg'], 'ski-1'), row('b', [])])

    const result = await reassignFallbackImages()

    expect(mockPoiFindMany).toHaveBeenCalledTimes(1)
    expect(mockPoiUpdate).toHaveBeenCalledWith({ where: { id: 'a' }, data: { fallback_image_id: null } })
    expect(mockPoiUpdate).toHaveBeenCalledWith({ where: { id: 'b' }, data: { fallback_image_id: 'ski-1' } })
    expect(result).toEqual({ examined: 2, updated: 2 })
  })

  it('une photo inexploitable (logo) compte comme absence de photo', async () => {
    mockPoiFindMany.mockResolvedValueOnce([row('a', ['https://example.com/logo.svg'])])

    await reassignFallbackImages()

    expect(mockPoiUpdate).toHaveBeenCalledWith({ where: { id: 'a' }, data: { fallback_image_id: 'ski-1' } })
  })
})
