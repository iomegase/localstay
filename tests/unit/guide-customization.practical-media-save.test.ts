const tx = {
  lodgingCustomization: { upsert: jest.fn() },
  lodgingFeaturedPoi: { updateMany: jest.fn(), upsert: jest.fn() },
  lodgingPracticalBlock: { updateMany: jest.fn(), createMany: jest.fn() },
  lodgingArrivalInstruction: { updateMany: jest.fn(), createMany: jest.fn() },
}

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: { findFirst: jest.fn() },
    lodgingCustomization: { findFirst: jest.fn() },
    category: { findMany: jest.fn() },
    pointOfInterest: { findMany: jest.fn() },
    lodgingFeaturedPoi: { findMany: jest.fn() },
    lodgingPracticalBlock: { findMany: jest.fn() },
    lodgingArrivalInstruction: { findMany: jest.fn() },
    $transaction: jest.fn(async (cb: (t: typeof tx) => unknown) => cb(tx)),
  },
}))

import { prisma } from '@/shared/lib/prisma'
import { saveLodgingCustomization } from '@/features/guide-customization/queries/customization'

describe('saveLodgingCustomization — médias infos pratiques', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(prisma.lodging.findFirst).mockResolvedValue({
      id: 'lodging-1',
      owner_id: 'owner-1',
      city_id: 'city-1',
      city: { latitude: 45, longitude: 6 },
    } as never)
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue(null)
    jest.mocked(prisma.category.findMany).mockResolvedValue([] as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([] as never)
    jest.mocked(prisma.lodgingArrivalInstruction.findMany).mockResolvedValue([] as never)
  })

  it('persists the presentation video on the customization row', async () => {
    await saveLodgingCustomization('owner-1', 'lodging-1', {
      category_order: [],
      featured_pois: [],
      presentation_video_url: 'https://youtu.be/dQw4w9WgXcQ',
    })

    const upsertArg = jest.mocked(tx.lodgingCustomization.upsert).mock.calls[0][0]
    expect(upsertArg.create).toMatchObject({
      presentation_video_url: 'https://youtu.be/dQw4w9WgXcQ',
    })
  })

  it('persists a video_url on a custom practical block', async () => {
    await saveLodgingCustomization('owner-1', 'lodging-1', {
      category_order: [],
      featured_pois: [],
      practical_blocks: [
        { title: 'Visite', body: null, icon: 'star', photo_url: null, video_url: 'https://youtu.be/dQw4w9WgXcQ', sort_order: 0 },
      ],
    })

    expect(tx.lodgingPracticalBlock.createMany).toHaveBeenCalledWith({
      data: [{
        lodging_id: 'lodging-1',
        title: 'Visite',
        body: null,
        icon: 'star',
        photo_url: null,
        video_url: 'https://youtu.be/dQw4w9WgXcQ',
        sort_order: 0,
      }],
    })
  })
})
