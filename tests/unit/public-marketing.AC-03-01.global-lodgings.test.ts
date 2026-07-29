jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodgingPublicProfile: {
      findMany: jest.fn(),
    },
  },
}))

import { prisma } from '@/shared/lib/prisma'
import { listPublishedLodgings } from '@/features/lodging-showcase/queries/public-lodgings'

describe('031-public-marketing-site global lodging list', () => {
  beforeEach(() => {
    jest.mocked(prisma.lodgingPublicProfile.findMany).mockReset()
  })

  it('returns only globally published profiles and keeps the existing public detail href', async () => {
    jest.mocked(prisma.lodgingPublicProfile.findMany).mockResolvedValue([
      {
        id: 'profile-1',
        slug: 'chalet-hygge',
        title: 'Chalet Hygge',
        short_description: 'Un chalet chaleureux.',
        property_type: 'Chalet',
        max_guests: 6,
        bedroom_count: 3,
        bathroom_count: 2,
        surface_m2: 170,
        public_area_label: 'Saint-Gervais-les-Bains',
        city: { slug: 'saint-gervais-les-bains', name: 'Saint-Gervais-les-Bains' },
        photos: [{ url: 'https://example.com/chalet.jpg' }],
        amenities: [{ label: 'Wi-Fi' }],
      },
    ])

    const result = await listPublishedLodgings({ limit: 2 })

    expect(prisma.lodgingPublicProfile.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        publication_status: 'published',
        deleted_at: null,
        city: { is_active: true, deleted_at: null },
        lodging: { is_active: true, deleted_at: null },
      },
      take: 2,
    }))
    expect(result).toEqual([
      expect.objectContaining({
        title: 'Chalet Hygge',
        city_name: 'Saint-Gervais-les-Bains',
        bathroom_count: 2,
        surface_m2: 170,
        href: '/guide/saint-gervais-les-bains/logements/chalet-hygge',
      }),
    ])
  })
})
