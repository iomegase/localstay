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

const baseLodging = {
  id: 'lodging-1',
  name: 'Le 305',
  city: { name: 'Saint-Gervais-les-Bains', latitude: 45.891, longitude: 6.713 },
  practical_blocks: [],
}

describe('054 AC-02-01/AC-05-02 — private guide data', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.lodgingFeaturedPoi.findMany as jest.Mock).mockResolvedValue([])
  })

  it('maps typed arrival steps, the key box code and lodging stats', async () => {
    lodgingFindFirst.mockResolvedValue({
      ...baseLodging,
      customization: { key_box_code: ' 4810 ', lodging_address: '305 route du Bettex' },
      public_profile: { max_guests: 6, bedroom_count: 3, surface_m2: 82, deleted_at: null },
      arrival_instructions: [{
        title: 'Garage', text: 'Deux places couvertes.', video_url: null, photos: [],
        kind: 'garage', tip: 'Hauteur 1,90 m',
        substeps: [{ title: 'Rampe', detail: 'À l’arrière' }, { broken: true }],
        facts: [{ label: 'Niveau', value: '−2' }],
      }],
    })

    const result = await getPrivateGuideData('lodging-1')

    expect(result?.lodging.keyBoxCode).toBe('4810')
    expect(result?.lodging.stats).toEqual({ guests: 6, bedrooms: 3, surfaceM2: 82 })
    expect(result?.lodging.arrivalInstructions[0]).toEqual({
      title: 'Garage', text: 'Deux places couvertes.', videoUrl: null, photos: [],
      kind: 'garage', tip: 'Hauteur 1,90 m',
      substeps: [{ title: 'Rampe', detail: 'À l’arrière' }],
      facts: [{ label: 'Niveau', value: '−2' }],
    })
  })

  it('055: exposes precise location, Facilibus coverage and the city transport cards', async () => {
    lodgingFindFirst.mockResolvedValue({
      ...baseLodging,
      city: {
        ...baseLodging.city,
        slug: 'saint-gervais-les-bains',
        transport_cards: [{ id: 'card-1', title: 'Taxi', tag: null, body: 'Sur réservation.' }],
      },
      customization: { lodging_latitude: 45.8915, lodging_longitude: 6.7085 },
      public_profile: null,
      arrival_instructions: [],
    })

    const result = await getPrivateGuideData('lodging-1')

    expect(result?.lodging).toMatchObject({
      locationPrecise: true,
      facilibus: true,
      latitude: 45.8915,
      transportCards: [{ id: 'card-1', title: 'Taxi', tag: null, body: 'Sur réservation.' }],
    })
  })

  it('055: never treats the city centre fallback as a precise location', async () => {
    lodgingFindFirst.mockResolvedValue({
      ...baseLodging,
      city: { ...baseLodging.city, slug: 'les-contamines-montjoie', transport_cards: [] },
      customization: { lodging_latitude: null, lodging_longitude: null },
      public_profile: null,
      arrival_instructions: [],
    })

    const result = await getPrivateGuideData('lodging-1')

    expect(result?.lodging).toMatchObject({ locationPrecise: false, facilibus: false, latitude: 45.891 })
  })

  it('leaves stats and key code empty when unknown', async () => {
    lodgingFindFirst.mockResolvedValue({
      ...baseLodging,
      customization: null,
      public_profile: null,
      arrival_instructions: [],
    })

    const result = await getPrivateGuideData('lodging-1')

    expect(result?.lodging.keyBoxCode).toBeNull()
    expect(result?.lodging.stats).toEqual({ guests: null, bedrooms: null, surfaceM2: null })
  })
})
