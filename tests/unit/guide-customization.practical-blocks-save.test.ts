const tx = {
  lodgingCustomization: { upsert: jest.fn() },
  lodgingFeaturedPoi: { updateMany: jest.fn(), upsert: jest.fn() },
  lodgingPracticalBlock: { updateMany: jest.fn(), create: jest.fn() },
}

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: { findFirst: jest.fn() },
    category: { findMany: jest.fn() },
    pointOfInterest: { findMany: jest.fn() },
    lodgingFeaturedPoi: { findMany: jest.fn() },
    lodgingPracticalBlock: { findMany: jest.fn() },
    $transaction: jest.fn(async (cb: (t: typeof tx) => unknown) => cb(tx)),
  },
}))

import { prisma } from '@/shared/lib/prisma'
import { saveLodgingCustomization } from '@/features/guide-customization/queries/customization'
import { GuideCustomizationError } from '@/features/guide-customization/types'

describe('saveLodgingCustomization — practical blocks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(prisma.lodging.findFirst).mockResolvedValue({
      id: 'lodging-1',
      owner_id: 'owner-1',
      city_id: 'city-1',
      city: { latitude: 45, longitude: 6 },
    } as never)
    jest.mocked(prisma.category.findMany).mockResolvedValue([] as never)
    jest.mocked(prisma.pointOfInterest.findMany).mockResolvedValue([
      {
        id: 'poi-1',
        city_id: 'city-1',
        category_id: 'cat-1',
        latitude: 45,
        longitude: 6,
        is_active: true,
        deleted_at: null,
        geocode_status: 'success',
      },
    ] as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([
      { id: 'b1', title: 'La plage', body: 'À 5 min', icon: 'star', photo_url: null, sort_order: 0 },
    ] as never)
  })

  it('soft-deletes existing blocks then recreates one row per normalized block', async () => {
    const result = await saveLodgingCustomization('owner-1', 'lodging-1', {
      category_order: [],
      featured_pois: [],
      practical_blocks: [
        { title: '  La plage  ', body: 'À 5 min', icon: 'star', photo_url: '', sort_order: 7 },
        { title: '', body: 'orphan', icon: 'info', photo_url: null, sort_order: 2 },
      ],
    })

    expect(tx.lodgingPracticalBlock.updateMany).toHaveBeenCalledWith({
      where: { lodging_id: 'lodging-1', deleted_at: null },
      data: { deleted_at: expect.any(Date) },
    })
    expect(tx.lodgingPracticalBlock.create).toHaveBeenCalledTimes(1)
    expect(tx.lodgingPracticalBlock.create).toHaveBeenCalledWith({
      data: {
        lodging_id: 'lodging-1',
        title: 'La plage',
        body: 'À 5 min',
        icon: 'star',
        photo_url: null,
        video_url: null,
        sort_order: 0,
      },
    })
    expect(result.practical_blocks).toEqual([
      { id: 'b1', title: 'La plage', body: 'À 5 min', icon: 'star', photo_url: null, sort_order: 0 },
    ])
  })

  it('normalizes and persists an owner note for a selected POI', async () => {
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([] as never)

    const result = await saveLodgingCustomization('owner-1', 'lodging-1', {
      category_order: [],
      featured_pois: [{
        poi_id: 'poi-1',
        owner_note: '  Notre terrasse préférée.  ',
        sort_order: 0,
      }],
    })

    expect(tx.lodgingFeaturedPoi.upsert).toHaveBeenCalledWith({
      where: { lodging_id_poi_id: { lodging_id: 'lodging-1', poi_id: 'poi-1' } },
      update: {
        owner_note: 'Notre terrasse préférée.',
        sort_order: 0,
        deleted_at: null,
      },
      create: {
        lodging_id: 'lodging-1',
        poi_id: 'poi-1',
        owner_note: 'Notre terrasse préférée.',
        sort_order: 0,
      },
    })
    expect(result.featured_pois).toEqual([{
      poi_id: 'poi-1',
      category_id: 'cat-1',
      owner_note: 'Notre terrasse préférée.',
      sort_order: 0,
    }])
  })

  it('rejects an owner note over 300 words before starting the transaction', async () => {
    const save = saveLodgingCustomization('owner-1', 'lodging-1', {
      category_order: [],
      featured_pois: [{
        poi_id: 'poi-1',
        owner_note: Array.from({ length: 301 }, () => 'mot').join(' '),
        sort_order: 0,
      }],
    })

    await expect(save).rejects.toEqual(
      expect.objectContaining<Partial<GuideCustomizationError>>({
        code: 'INVALID_FEATURED_POI',
      }),
    )
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})
