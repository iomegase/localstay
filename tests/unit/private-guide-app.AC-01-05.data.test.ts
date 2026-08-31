/** @jest-environment node */

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: { findFirst: jest.fn() },
    lodgingFeaturedPoi: { findMany: jest.fn() },
  },
}))

import { getPrivateGuideData } from '@/features/guide-app/queries/private-guide-data'
import {
  FIXED_DEPARTURE_INSTRUCTIONS,
  FIXED_HOUSE_RULES,
} from '@/features/guide-app/lib/fixed-lodging-content'
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
        checkout_instructions: null,
        house_rules: null,
        emergency_contacts: null,
        useful_services: null,
      },
      practical_blocks: [],
      arrival_instructions: [],
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
          city: {
            slug: 'les-contamines-montjoie',
          },
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
      citySlug: 'les-contamines-montjoie',
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

  it('maps useful numbers but ignores customized departure instructions and house rules', async () => {
    lodgingFindFirst.mockResolvedValue({
      id: 'lodging-1',
      name: 'Le Chalet Hygge',
      city: { name: 'Saint-Gervais-les-Bains', latitude: 45.891, longitude: 6.713 },
      customization: {
        welcome_message: null,
        cover_photo_url: null,
        lodging_address: null,
        lodging_latitude: null,
        lodging_longitude: null,
        wifi_ssid: null,
        wifi_password: null,
        checkout_instructions: 'Ancienne consigne personnalisée',
        house_rules: 'Ancienne règle personnalisée',
        emergency_contacts: 'Pompiers: 18', // ne doit PAS alimenter les numéros utiles
        useful_services: 'Office de tourisme: 04 50 47 76 08\nPharmacie: 04 50 78 12 34',
      },
      practical_blocks: [],
      arrival_instructions: [],
    })
    featuredFindMany.mockResolvedValue([])

    const result = await getPrivateGuideData('lodging-1')

    expect(result?.lodging.usefulNumbers).toEqual([
      { label: 'Office de tourisme', number: '04 50 47 76 08' },
      { label: 'Pharmacie', number: '04 50 78 12 34' },
    ])
    expect(result?.lodging.departureInstructions).toEqual(
      FIXED_DEPARTURE_INSTRUCTIONS,
    )
    expect(result?.lodging.houseRules).toEqual(FIXED_HOUSE_RULES)
  })

  it('maps a practical block photo and video onto its card', async () => {
    lodgingFindFirst.mockResolvedValue({
      id: 'lodging-1',
      name: 'Le Chalet Hygge',
      city: { name: 'Saint-Gervais-les-Bains', latitude: 45.891, longitude: 6.713 },
      customization: {
        welcome_message: null,
        cover_photo_url: null,
        lodging_address: null,
        lodging_latitude: null,
        lodging_longitude: null,
        wifi_ssid: null,
        wifi_password: null,
        checkout_instructions: null,
        house_rules: null,
        emergency_contacts: null,
        useful_services: null,
      },
      practical_blocks: [
        {
          id: 'block-1',
          title: 'Parking',
          body: 'Devant le chalet.',
          icon: 'car',
          photo_url: 'https://cdn.example.com/parking.jpg',
          video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        },
      ],
      arrival_instructions: [],
    })
    featuredFindMany.mockResolvedValue([])

    const result = await getPrivateGuideData('lodging-1')

    expect(result?.lodging.practicalCards[0]).toMatchObject({
      title: 'Parking',
      photoUrl: 'https://cdn.example.com/parking.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    })
  })

  it('maps the existing presentation video URL onto the private guide lodging', async () => {
    lodgingFindFirst.mockResolvedValue({
      id: 'lodging-1',
      name: 'Le Chalet Hygge',
      city: { name: 'Saint-Gervais-les-Bains', latitude: 45.891, longitude: 6.713 },
      customization: {
        welcome_message: null,
        cover_photo_url: null,
        lodging_address: null,
        lodging_latitude: null,
        lodging_longitude: null,
        wifi_ssid: null,
        wifi_password: null,
        emergency_contacts: null,
        useful_services: null,
        trash_bins: null,
        trash_location: null,
        presentation_video_url: '  https://youtu.be/dQw4w9WgXcQ  ',
      },
      practical_blocks: [],
      arrival_instructions: [],
    })
    featuredFindMany.mockResolvedValue([])

    const result = await getPrivateGuideData('lodging-1')

    expect(result?.lodging.presentationVideoUrl).toBe(
      'https://youtu.be/dQw4w9WgXcQ',
    )
    expect(lodgingFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          customization: expect.objectContaining({
            select: expect.objectContaining({ presentation_video_url: true }),
          }),
        }),
      }),
    )
  })

  it('maps arrival instructions (text + video + photos) in order', async () => {
    lodgingFindFirst.mockResolvedValue({
      id: 'lodging-1',
      name: 'Le Chalet Hygge',
      city: { name: 'Saint-Gervais-les-Bains', latitude: 45.891, longitude: 6.713 },
      customization: {
        welcome_message: null,
        cover_photo_url: null,
        lodging_address: null,
        lodging_latitude: null,
        lodging_longitude: null,
        wifi_ssid: null,
        wifi_password: null,
        checkout_instructions: null,
        house_rules: null,
        emergency_contacts: null,
        useful_services: null,
      },
      practical_blocks: [],
      arrival_instructions: [
        {
          text: 'Ouvrez le portail',
          video_url: 'https://youtu.be/abc',
          photos: ['https://cdn.example.com/a.jpg'],
        },
      ],
    })
    featuredFindMany.mockResolvedValue([])

    const result = await getPrivateGuideData('lodging-1')

    expect(result?.lodging.arrivalInstructions).toEqual([
      {
        text: 'Ouvrez le portail',
        videoUrl: 'https://youtu.be/abc',
        photos: ['https://cdn.example.com/a.jpg'],
      },
    ])
  })

  it('maps active trash bins and the sorting point location', async () => {
    lodgingFindFirst.mockResolvedValue({
      id: 'lodging-1',
      name: 'Le Chalet Hygge',
      city: { name: 'Saint-Gervais-les-Bains', latitude: 45.891, longitude: 6.713 },
      customization: {
        welcome_message: null,
        cover_photo_url: null,
        lodging_address: null,
        lodging_latitude: null,
        lodging_longitude: null,
        wifi_ssid: null,
        wifi_password: null,
        checkout_instructions: null,
        house_rules: null,
        emergency_contacts: null,
        useful_services: null,
        trash_bins: [{ type: 'jaune' }, { type: 'verte' }],
        trash_location: '  https://maps.app.goo.gl/abc  ',
      },
      practical_blocks: [],
      arrival_instructions: [],
    })
    featuredFindMany.mockResolvedValue([])

    const result = await getPrivateGuideData('lodging-1')

    expect(result?.lodging.trashBins).toEqual([{ type: 'jaune' }, { type: 'verte' }])
    expect(result?.lodging.trashLocation).toBe('https://maps.app.goo.gl/abc')
  })

  it('returns null when the active lodging cannot be resolved', async () => {
    lodgingFindFirst.mockResolvedValue(null)

    await expect(getPrivateGuideData('missing')).resolves.toBeNull()
    expect(featuredFindMany).not.toHaveBeenCalled()
  })
})
