jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodgingPublicProfile: {
      findMany: jest.fn(),
    },
  },
}))

import { prisma } from '@/shared/lib/prisma'
import { listPublishedMarketingLodgingsForCity } from '@/features/lodging-showcase/queries/public-lodgings'

describe('046 local SEO published lodging query', () => {
  beforeEach(() => {
    jest.mocked(prisma.lodgingPublicProfile.findMany).mockReset()
  })

  it('returns only published, active, non-deleted profiles for the requested city', async () => {
    jest.mocked(prisma.lodgingPublicProfile.findMany).mockResolvedValue([
      {
        id: 'profile-1',
        slug: 'chalet-hygge',
        title: 'Le Chalet Hygge',
        short_description: 'Un chalet chaleureux face aux montagnes.',
        property_type: 'Chalet',
        max_guests: 6,
        bedroom_count: 3,
        bathroom_count: 2,
        surface_m2: 110,
        public_area_label: 'Saint-Gervais-les-Bains',
        external_booking_url: 'https://www.airbnb.fr/rooms/123',
        external_booking_platform: 'airbnb',
        city: { slug: 'saint-gervais-les-bains', name: 'Saint-Gervais-les-Bains' },
        photos: [{ url: 'https://images.example/chalet.webp' }],
        amenities: [{ label: 'Wi-Fi' }],
      },
    ])

    const result = await listPublishedMarketingLodgingsForCity('saint-gervais-les-bains')

    expect(prisma.lodgingPublicProfile.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        publication_status: 'published',
        deleted_at: null,
        city: {
          slug: 'saint-gervais-les-bains',
          is_active: true,
          deleted_at: null,
        },
        lodging: { is_active: true, deleted_at: null },
      },
    }))
    expect(result).toEqual([
      expect.objectContaining({
        href: '/logements/chalet-hygge',
        city_slug: 'saint-gervais-les-bains',
        external_booking_url: 'https://www.airbnb.fr/rooms/123',
        external_booking_platform: 'airbnb',
      }),
    ])
  })
})
