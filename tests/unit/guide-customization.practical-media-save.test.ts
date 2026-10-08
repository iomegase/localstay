const tx = {
  lodgingCustomization: { upsert: jest.fn() },
  lodgingFeaturedPoi: { updateMany: jest.fn(), upsert: jest.fn() },
  lodgingPracticalBlock: { findMany: jest.fn(), update: jest.fn(), updateMany: jest.fn(), create: jest.fn() },
  lodgingArrivalInstruction: { findMany: jest.fn(), update: jest.fn(), updateMany: jest.fn(), create: jest.fn() },
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
    tx.lodgingPracticalBlock.findMany.mockResolvedValue([])
    tx.lodgingArrivalInstruction.findMany.mockResolvedValue([])
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
  // Spec 096 : la vidéo d'un équipement vient de la bibliothèque (tests/unit/admin-managed-equipment.AC-03.save-sync.test.ts).
})
