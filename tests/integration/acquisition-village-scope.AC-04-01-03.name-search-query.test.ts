const mockCityFindFirst = jest.fn()
const mockCityFindMany = jest.fn()
const mockSearchGooglePlacesByName = jest.fn()

const mockMemoryFindMany = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    poiAcquisitionMemory: { findMany: (...args: unknown[]) => mockMemoryFindMany(...args) },
    city: {
      findFirst: (...args: unknown[]) => mockCityFindFirst(...args),
      findMany: (...args: unknown[]) => mockCityFindMany(...args),
    },
  },
}))

jest.mock('@/features/poi-acquisition/lib/google-places', () => ({
  searchGooglePlacesByName: (...args: unknown[]) => mockSearchGooglePlacesByName(...args),
}))

import { searchAcquisitionPlacesByName } from '@/features/poi-acquisition/queries/name-search'

// Spec 066 AC-04-01 / AC-04-03 : statut et village de rattachement de chaque résultat.
const SAINT_GERVAIS = { id: 'city-sg', slug: 'saint-gervais-les-bains', name: 'Saint-Gervais-les-Bains', latitude: 45.89227, longitude: 6.712007 }
const SAINT_NICOLAS = { id: 'city-sn', slug: 'saint-nicolas-de-veroce', name: 'Saint-Nicolas-de-Véroce', latitude: 45.863934, longitude: 6.717467 }

function candidate(id: string, location: { latitude: number; longitude: number } | null, business_status: string | null) {
  return { google_place_id: id, name: id, address: `${id} adresse`, business_status, location }
}

describe('066 AC-04 — recherche par nom', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCityFindFirst.mockResolvedValue(SAINT_GERVAIS)
    mockCityFindMany.mockResolvedValue([SAINT_GERVAIS, SAINT_NICOLAS])
    mockMemoryFindMany.mockResolvedValue([])
  })

  it('AC-04-01 / AC-04-03 : indique le statut et signale un autre village', async () => {
    mockSearchGooglePlacesByName.mockResolvedValue([
      candidate('le-galeta', { latitude: 45.8925, longitude: 6.7122 }, 'CLOSED_TEMPORARILY'),
      candidate('bistrot-du-mont-joly', { latitude: 45.8605, longitude: 6.7181 }, 'OPERATIONAL'),
      candidate('sans-position', null, null),
    ])

    const results = await searchAcquisitionPlacesByName({ city_id: 'city-sg', query: 'Le Galeta' })

    expect(mockSearchGooglePlacesByName).toHaveBeenCalledWith({
      query: 'Le Galeta', cityName: 'Saint-Gervais-les-Bains', latitude: 45.89227, longitude: 6.712007,
    })
    expect(results).toEqual([
      {
        google_place_id: 'le-galeta', name: 'le-galeta', address: 'le-galeta adresse',
        business_status: 'CLOSED_TEMPORARILY',
        nearest_city: { slug: 'saint-gervais-les-bains', name: 'Saint-Gervais-les-Bains' },
        is_other_village: false,
        memory: null,
      },
      {
        google_place_id: 'bistrot-du-mont-joly', name: 'bistrot-du-mont-joly', address: 'bistrot-du-mont-joly adresse',
        business_status: 'OPERATIONAL',
        nearest_city: { slug: 'saint-nicolas-de-veroce', name: 'Saint-Nicolas-de-Véroce' },
        is_other_village: true,
        memory: null,
      },
      {
        google_place_id: 'sans-position', name: 'sans-position', address: 'sans-position adresse',
        business_status: null, nearest_city: null, is_other_village: false, memory: null,
      },
    ])
  })

  it('404 CITY_NOT_FOUND pour une ville inactive ou inconnue', async () => {
    mockCityFindFirst.mockResolvedValue(null)

    await expect(searchAcquisitionPlacesByName({ city_id: 'x', query: 'Le Galeta' }))
      .rejects.toMatchObject({ code: 'CITY_NOT_FOUND', status: 404 })
  })

  it('502 GOOGLE_PLACES_UNAVAILABLE si Google échoue', async () => {
    mockSearchGooglePlacesByName.mockRejectedValue(new Error('Google Places search failed: 500'))

    await expect(searchAcquisitionPlacesByName({ city_id: 'city-sg', query: 'Le Galeta' }))
      .rejects.toMatchObject({ code: 'GOOGLE_PLACES_UNAVAILABLE', status: 502 })
  })

  it('071 AC-04-02 : signale un lieu déjà rejeté ou exclu', async () => {
    mockSearchGooglePlacesByName.mockResolvedValue([candidate('le-galeta', null, 'OPERATIONAL')])
    mockMemoryFindMany.mockResolvedValue([
      { google_place_id: 'le-galeta', kind: 'rejected', category_id: 'cat-diner', category: { name: 'Restaurant' } },
    ])

    const [result] = await searchAcquisitionPlacesByName({ city_id: 'city-sg', query: 'Le Galeta' })

    expect(result!.memory).toEqual({ kind: 'rejected', categories: ['Restaurant'] })
  })
})
