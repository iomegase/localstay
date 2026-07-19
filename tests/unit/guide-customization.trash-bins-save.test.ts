const tx = {
  lodgingCustomization: { upsert: jest.fn() },
  lodgingFeaturedPoi: { updateMany: jest.fn(), upsert: jest.fn() },
  lodgingPracticalBlock: { updateMany: jest.fn(), createMany: jest.fn() },
}

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: { findFirst: jest.fn() },
    lodgingCustomization: { findFirst: jest.fn() },
    category: { findMany: jest.fn() },
    pointOfInterest: { findMany: jest.fn() },
    lodgingFeaturedPoi: { findMany: jest.fn() },
    lodgingPracticalBlock: { findMany: jest.fn() },
    $transaction: jest.fn(async (cb: (t: typeof tx) => unknown) => cb(tx)),
  },
}))

import { prisma } from '@/shared/lib/prisma'
import { saveLodgingCustomization } from '@/features/guide-customization/queries/customization'

describe('saveLodgingCustomization — trash bins', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(prisma.lodging.findFirst).mockResolvedValue({
      id: 'lodging-1', owner_id: 'owner-1', city_id: 'city-1', city: { latitude: 45, longitude: 6 },
    } as never)
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue(null)
    jest.mocked(prisma.category.findMany).mockResolvedValue([] as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([] as never)
  })

  it('normalizes and persists trash bins on the customization row', async () => {
    const result = await saveLodgingCustomization('owner-1', 'lodging-1', {
      category_order: [],
      featured_pois: [],
      trash_bins: [
        { type: 'jaune' },
        { type: 'rose' },
        { type: 'jaune' },
      ],
    })

    const upsertArg = jest.mocked(tx.lodgingCustomization.upsert).mock.calls[0][0]
    expect(upsertArg.create.trash_bins).toEqual([{ type: 'jaune' }])
    expect(result.trash_bins).toEqual([{ type: 'jaune' }])
  })
})
