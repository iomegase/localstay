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

describe('066 — pipeline d’acquisition', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCityFindFirst.mockResolvedValue(SAINT_GERVAIS)
    mockCityFindMany.mockResolvedValue([SAINT_GERVAIS, SAINT_NICOLAS])
    mockCategoryFindFirst.mockResolvedValue({ id: 'cat-diner', name: 'Dîner', subcategories: [] })
    mockRunCreate.mockResolvedValue({ id: 'run-1' })
    mockRunUpdate.mockResolvedValue({ id: 'run-1' })
    mockPoiFindMany.mockResolvedValue([])
    mockCallGemini.mockResolvedValue([{ description: 'Description vérifiée.' }])
    mockGeocodeForAcquisition.mockResolvedValue({ status: 'success', latitude: 45.8925, longitude: 6.7122, confidence: 0.9 })
    setRunDetail({
      id: 'run-1', status: 'completed', error: null,
      skipped_other_village: 0, skipped_closed_permanently: 0,
      city: { name: 'Saint-Gervais-les-Bains' }, category: { name: 'Dîner' }, candidates: [],
    })
    global.fetch = jest.fn(async () => Response.json({
      places: [
        place('le-terrier'),
        place('bistrot-du-mont-joly', { location: { latitude: 45.8605, longitude: 6.7181 } }),
        place('ancien-resto', { businessStatus: 'CLOSED_PERMANENTLY' }),
        place('le-galeta', { businessStatus: 'CLOSED_TEMPORARILY' }),
        place('sans-position', { location: undefined }),
      ],
    }))
  })

  it('AC-01-01 / AC-01-03 / AC-02-02 : ne garde que les lieux du village, ouverts ou fermés temporairement', async () => {
    await createAcquisitionRun({ city_id: SAINT_GERVAIS.id, category_id: 'cat-diner' }, 'admin-1')

    expect(candidateNames()).toEqual(['le-terrier', 'le-galeta', 'sans-position'])
    expect(mockCityFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { is_active: true, deleted_at: null },
    }))
  })

  it('AC-01-02 / BR-03 : aucun appel Gemini ni Mapbox pour les lieux écartés', async () => {
    await createAcquisitionRun({ city_id: SAINT_GERVAIS.id, category_id: 'cat-diner' }, 'admin-1')

    expect(mockCallGemini).toHaveBeenCalledTimes(3)
    expect(mockGeocodeForAcquisition).toHaveBeenCalledTimes(3)
    const geocodedAddresses = mockGeocodeForAcquisition.mock.calls.map(call => String(call[0]))
    expect(geocodedAddresses.some(address => address.includes('bistrot-du-mont-joly'))).toBe(false)
    expect(geocodedAddresses.some(address => address.includes('ancien-resto'))).toBe(false)
  })

  it('AC-01-02 / AC-02-02 : compte les lieux écartés sur le run', async () => {
    await createAcquisitionRun({ city_id: SAINT_GERVAIS.id, category_id: 'cat-diner' }, 'admin-1')

    // Spec 072 : compteurs écrits avec la file d'attente, statut en fin de traitement.
    expect(mockRunUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ skipped_other_village: 1, skipped_closed_permanently: 1 }),
    }))
    expect(mockRunUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'completed' }) }))
  })

  it('AC-02-03 : enregistre le statut d’ouverture du candidat', async () => {
    await createAcquisitionRun({ city_id: SAINT_GERVAIS.id, category_id: 'cat-diner' }, 'admin-1')

    const statuses = Object.fromEntries(mockCandidateCreate.mock.calls.map(call => {
      const data = (call[0] as { data: { name: string; business_status: string | null } }).data
      return [data.name, data.business_status]
    }))
    expect(statuses).toEqual({ 'le-terrier': 'OPERATIONAL', 'le-galeta': 'CLOSED_TEMPORARILY', 'sans-position': 'OPERATIONAL' })
  })

  it('AC-04-02 / BR-05 : un lieu précis crée un run à candidat unique, sans filtre village', async () => {
    const urls: string[] = []
    global.fetch = jest.fn(async input => {
      urls.push(String(input))
      return Response.json(place('bistrot-du-mont-joly', {
        businessStatus: 'CLOSED_TEMPORARILY',
        location: { latitude: 45.8605, longitude: 6.7181 },
      }))
    })

    await createAcquisitionRun(
      { city_id: SAINT_GERVAIS.id, category_id: 'cat-diner', google_place_id: 'bistrot-du-mont-joly' },
      'admin-1',
    )

    expect(mockRunCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ source: 'google_places_name' }),
    }))
    expect(urls.every(url => url.startsWith('https://places.googleapis.com/v1/places/bistrot-du-mont-joly'))).toBe(true)
    expect(candidateNames()).toEqual(['bistrot-du-mont-joly'])
  })

  it('AC-01-04 / AC-02-03 : le détail du run expose compteurs et statut d’ouverture', async () => {
    mockRunFindFirst.mockResolvedValue({
      id: 'run-1', status: 'completed', error: null,
      skipped_other_village: 4, skipped_closed_permanently: 2,
      city: { name: 'Saint-Gervais-les-Bains' }, category: { name: 'Dîner' },
      candidates: [{
        id: 'cand-1', name: 'le-galeta', address: 'Adresse', source: 'google_places',
        match_status: 'matched', geocode_status: 'success', review_status: 'needs_review',
        duplicate_poi_ids: [], google_place_id: 'le-galeta', google_review_payload: null,
        business_status: 'CLOSED_TEMPORARILY',
      }],
    })

    const run = await getAcquisitionRun('run-1')

    expect(run).toMatchObject({
      skipped_other_village: 4,
      skipped_closed_permanently: 2,
      candidates: [{ business_status: 'CLOSED_TEMPORARILY' }],
    })
  })
})
