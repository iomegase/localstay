const mockCityFindFirst = jest.fn()
const mockCityFindMany = jest.fn()
const mockCategoryFindFirst = jest.fn()
const mockRunCreate = jest.fn()
const mockRunUpdate = jest.fn()
const mockRunFindFirst = jest.fn()
const mockCandidateCreate = jest.fn()
const mockPoiFindMany = jest.fn()
const mockCallGemini = jest.fn()
const mockGeocodeForAcquisition = jest.fn()

// Spec 100 : temps de trajet Mapbox simulés (aucun appel réseau).
const mockDrivingSeconds = jest.fn(async (): Promise<Record<string, number | null>> => ({}))
jest.mock('@/features/transport/travel-times', () => ({
  computeDrivingSeconds: () => mockDrivingSeconds(),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: {
      findFirst: (...args: unknown[]) => mockCityFindFirst(...args),
      findMany: (...args: unknown[]) => mockCityFindMany(...args),
    },
    category: { findFirst: (...args: unknown[]) => mockCategoryFindFirst(...args) },
    poiAcquisitionRun: {
      findMany: async () => [],
      create: (...args: unknown[]) => mockRunCreate(...args),
      update: (...args: unknown[]) => mockRunUpdate(...args),
      findFirst: (...args: unknown[]) => mockRunFindFirst(...args),
    },
    poiAcquisitionCandidate: { create: (...args: unknown[]) => mockCandidateCreate(...args) },
    // Spec 071 : aucune mémoire de revue dans ces scénarios.
    poiAcquisitionMemory: { findMany: async () => [] },
    pointOfInterest: { findMany: (...args: unknown[]) => mockPoiFindMany(...args) },
  },
}))

jest.mock('@/features/gemini-fetch/services/gemini-client', () => ({
  callGemini: (...args: unknown[]) => mockCallGemini(...args),
}))

jest.mock('@/features/poi-acquisition/lib/geocode', () => ({
  geocodeForAcquisition: (...args: unknown[]) => mockGeocodeForAcquisition(...args),
}))

import { createAcquisitionRun, getAcquisitionRun } from '@/features/poi-acquisition/queries/runs'

// Spec 066 — filtres avant traitement payant, compteurs, lieu précis.
const SAINT_GERVAIS = { id: 'city-sg', slug: 'saint-gervais-les-bains', name: 'Saint-Gervais-les-Bains', postal_code: '74170', latitude: 45.89227, longitude: 6.712007 }
const SAINT_NICOLAS = { id: 'city-sn', slug: 'saint-nicolas-de-veroce', name: 'Saint-Nicolas-de-Véroce', postal_code: '74170', latitude: 45.863934, longitude: 6.717467 }

function place(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    displayName: { text: id },
    formattedAddress: `${id}, 74170 Saint-Gervais-les-Bains, France`,
    location: { latitude: 45.8925, longitude: 6.7122 },
    businessStatus: 'OPERATIONAL',
    ...overrides,
  }
}

function candidateNames(): string[] {
  return mockCandidateCreate.mock.calls.map(call => (call[0] as { data: { name: string } }).data.name)
}


// Spec 072 : file d'attente du lancement, écrite puis relue par le traitement par lots.
let pendingPlaces: unknown = []
function setRunDetail(detail: Record<string, unknown>) {
  pendingPlaces = []
  mockRunUpdate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
    if ('pending_places' in data) pendingPlaces = data.pending_places
    return { id: 'run-1' }
  })
  mockRunFindFirst.mockImplementation(async () => {
    const [city, category] = await Promise.all([mockCityFindFirst(), mockCategoryFindFirst()])
    return {
      ...detail,
      source_url: null,
      pending_places: pendingPlaces,
      processed_count: 0,
      city: { ...(detail.city as object), ...(city as object) },
      category: { ...(detail.category as object), ...(category as object) },
    }
  })
}

// Spec 100 AC-01-01 / AC-01-02 — lieu à plus de 20 min en voiture écarté avant traitement.
describe('100 — pipeline : temps de trajet en voiture', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCityFindFirst.mockResolvedValue(SAINT_GERVAIS)
    mockCityFindMany.mockResolvedValue([SAINT_GERVAIS])
    mockCategoryFindFirst.mockResolvedValue({ id: 'cat-cafes', name: 'Cafés', subcategories: [] })
    mockRunCreate.mockResolvedValue({ id: 'run-1' })
    mockPoiFindMany.mockResolvedValue([])
    mockCallGemini.mockResolvedValue([{ description: 'Description vérifiée.' }])
    mockGeocodeForAcquisition.mockResolvedValue({ status: 'success', latitude: 45.8925, longitude: 6.7122, confidence: 0.9 })
    setRunDetail({
      id: 'run-1', status: 'completed', error: null,
      skipped_other_village: 0, skipped_closed_permanently: 0,
      city: { name: 'Saint-Gervais-les-Bains' }, category: { name: 'Cafés' }, candidates: [],
    })
    global.fetch = jest.fn(async () => Response.json({
      places: [place('cafe-du-village'), place('cafe-autre-vallee', { location: { latitude: 45.76, longitude: 6.75 } })],
    }))
    mockDrivingSeconds.mockResolvedValue({ 'cafe-du-village': 300, 'cafe-autre-vallee': 7200 })
  })

  it('n’enregistre pas le lieu à 2 h de route et compte l’écart sur le run', async () => {
    await createAcquisitionRun({ city_id: SAINT_GERVAIS.id, category_id: 'cat-cafes' }, 'admin-1')

    expect(candidateNames()).toEqual(['cafe-du-village'])
    expect(mockGeocodeForAcquisition).toHaveBeenCalledTimes(1)
    expect(mockRunUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ skipped_too_far_by_road: 1 }),
    }))
  })

  it('AC-01-04 : Mapbox indisponible → les deux lieux sont conservés', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    mockDrivingSeconds.mockRejectedValue(new Error('MAPBOX_MATRIX_HTTP_503'))
    await createAcquisitionRun({ city_id: SAINT_GERVAIS.id, category_id: 'cat-cafes' }, 'admin-1')
    expect(candidateNames()).toEqual(['cafe-du-village', 'cafe-autre-vallee'])
  })
})
