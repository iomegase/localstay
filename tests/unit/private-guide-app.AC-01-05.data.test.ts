/** @jest-environment node */

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: { findFirst: jest.fn() },
    lodgingFeaturedPoi: { findMany: jest.fn() },
  },
}))

import { getPrivateGuideData } from '@/features/guide-app/queries/private-guide-data'
import { prisma } from '@/shared/lib/prisma'

const lodgingFindFirst = prisma.lodging.findFirst as jest.Mock
const featuredFindMany = prisma.lodgingFeaturedPoi.findMany as jest.Mock

describe('034-private-guide-app private data adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('maps only active real lodging recommendations in owner order', async () => {
    lodgingFindFirst.mockResolvedValue({
      id: 'lodging-1',
      name: 'Le Chalet Hygge',
      city: {
        name: 'Saint-Gervais-les-Bains',
        latitude: 45.891,
        longitude: 6.713,
      },
      customization: {
        welcome_message: 'Bienvenue au chalet',
        cover_photo_url: '/chalet.jpg',
        lodging_address: '1 rue du Mont-Blanc',
        lodging_latitude: 45.89,
        lodging_longitude: 6.71,
        wifi_ssid: null,
        wifi_password: null,
        equipment_info: null,
        checkout_instructions: null,
        house_rules: null,
        emergency_contacts: null,
        useful_services: null,
      },
      practical_blocks: [],
    })
    featuredFindMany.mockResolvedValue([
      {
        owner_note: 'Notre table préférée',
        poi: {
          id: 'poi-1',
          name: 'Rond de Carotte',
          slug: 'rond-de-carotte',
          description: 'Cuisine locale',
          address: 'Saint-Gervais',
          latitude: 45.89,
          longitude: 6.71,
          phone: null,
          website: 'https://example.com',
          rating: 4.8,
          rating_count: 120,
          is_open_now: true,
          hours: null,
          photos: ['/hero.jpg'],
          category: {
            slug: 'diner',
            name: 'Restaurants',
            icon: 'utensils',
          },
          trail_detail: null,
        },
      },
    ])

    const result = await getPrivateGuideData('lodging-1')

    expect(result?.lodging.name).toBe('Le Chalet Hygge')
    expect(result?.lodging.city).toBe('Saint-Gervais-les-Bains')
    expect(result?.pois).toHaveLength(1)
    expect(result?.pois[0]).toMatchObject({
      name: 'Rond de Carotte',
      photos: ['/hero.jpg'],
      ownerNote: 'Notre table préférée',
      recommended: true,
    })
    expect(featuredFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          lodging_id: 'lodging-1',
          deleted_at: null,
        }),
        orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
      }),
    )
  })

  it('returns null when the active lodging cannot be resolved', async () => {
    lodgingFindFirst.mockResolvedValue(null)

    await expect(getPrivateGuideData('missing')).resolves.toBeNull()
    expect(featuredFindMany).not.toHaveBeenCalled()
  })
})
