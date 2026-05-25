const mockCityFindFirst = jest.fn()
const mockCategoryFindFirst = jest.fn()
const mockRunCreate = jest.fn()
const mockRunUpdate = jest.fn()
const mockRunFindFirst = jest.fn()
const mockCandidateCreate = jest.fn()
const mockPoiFindMany = jest.fn()
const mockCallGemini = jest.fn()
const mockGeocodeForAcquisition = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: { findFirst: (...args: unknown[]) => mockCityFindFirst(...args) },
    category: { findFirst: (...args: unknown[]) => mockCategoryFindFirst(...args) },
    poiAcquisitionRun: {
      create: (...args: unknown[]) => mockRunCreate(...args),
      update: (...args: unknown[]) => mockRunUpdate(...args),
      findFirst: (...args: unknown[]) => mockRunFindFirst(...args),
    },
    poiAcquisitionCandidate: {
      create: (...args: unknown[]) => mockCandidateCreate(...args),
    },
    pointOfInterest: {
      findMany: (...args: unknown[]) => mockPoiFindMany(...args),
    },
  },
}))

jest.mock('@/features/gemini-fetch/services/gemini-client', () => ({
  callGemini: (...args: unknown[]) => mockCallGemini(...args),
}))

jest.mock('@/features/poi-acquisition/lib/geocode', () => ({
  geocodeForAcquisition: (...args: unknown[]) => mockGeocodeForAcquisition(...args),
}))

import { createAcquisitionRun } from '@/features/poi-acquisition/queries/runs'

const googlePlacesResponse = {
  places: [
    {
      id: 'google-place-1',
      displayName: { text: 'Médiathèque Municipale de Saint-Gervais' },
      formattedAddress: '450 avenue du Mont d’Arbois, 74170 Saint-Gervais-les-Bains',
      nationalPhoneNumber: '04 50 93 57 90',
      websiteUri: 'https://bibliotheque.saintgervais.com',
      rating: 4.7,
    },
  ],
}

describe('018 Google Places primary POI acquisition', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn(async () => Response.json(googlePlacesResponse))
    mockCityFindFirst.mockResolvedValue({
      id: 'city-1',
      name: 'Saint-Gervais-les-Bains',
      postal_code: '74170',
      latitude: 45.8921,
      longitude: 6.7085,
    })
    mockCategoryFindFirst.mockResolvedValue({ id: 'cat-1', name: 'Culture' })
    mockRunCreate.mockResolvedValue({ id: 'run-1' })
    mockRunUpdate.mockResolvedValue({ id: 'run-1' })
    mockPoiFindMany.mockResolvedValue([])
    mockGeocodeForAcquisition.mockResolvedValue({
      status: 'success',
      latitude: 45.88954,
      longitude: 6.71294,
      confidence: 0.96,
    })
    mockRunFindFirst.mockResolvedValue({
      id: 'run-1',
      status: 'completed',
      error: null,
      city: { name: 'Saint-Gervais-les-Bains' },
      category: { name: 'Culture' },
      candidates: [
        {
          id: 'cand-1',
          name: 'Médiathèque Municipale de Saint-Gervais',
          address: '450 avenue du Mont d’Arbois, 74170 Saint-Gervais-les-Bains',
          source: 'google_places',
          match_status: 'matched',
          geocode_status: 'success',
          review_status: 'needs_review',
          duplicate_poi_ids: [],
          google_place_id: 'google-place-1',
          google_review_payload: { attribution: 'Google Maps' },
        },
      ],
    })
  })

  it('AC-01-02/AC-01-03: creates candidates from Google Places and uses Gemini only for description', async () => {
    mockCallGemini.mockResolvedValue([
      {
        name: 'Lieu halluciné par Gemini',
        address: 'Adresse inventée',
        phone: null,
        website: null,
        description: 'Description éditoriale réaliste issue des données vérifiées.',
        subcategory: null,
        hours: null,
        tags: [],
      },
    ])

    await createAcquisitionRun({ city_id: 'city-1', category_id: 'cat-1' }, 'admin-1')

    expect(mockCandidateCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        run_id: 'run-1',
        source: 'google_places',
        name: 'Médiathèque Municipale de Saint-Gervais',
        address: '450 avenue du Mont d’Arbois, 74170 Saint-Gervais-les-Bains',
        phone: '04 50 93 57 90',
        website: 'https://bibliotheque.saintgervais.com',
        description: 'Description éditoriale réaliste issue des données vérifiées.',
        google_place_id: 'google-place-1',
        match_status: 'matched',
      }),
    })
  })
})
