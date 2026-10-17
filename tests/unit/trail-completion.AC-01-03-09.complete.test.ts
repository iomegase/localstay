const mockRoute = jest.fn()
const mockIgnPlace = jest.fn()
const mockIgnEnrich = jest.fn(async (_items: unknown[]) => ({ enriched: 0, errors: 0 }))
const mockDuration = jest.fn(async (_items: unknown[]) => ({ naismith: 0, ors: 0, errors: 0 }))
const mockPhotos = jest.fn(async (_items: unknown[]) => ({ enriched: 0, errors: 0 }))
const mockDriving = jest.fn(async () => ({}))

jest.mock('@/features/trails-acquisition/services/ors', () => ({
  fetchOrsHikingRoute: (...args: unknown[]) => mockRoute(...args),
  enrichCandidatesWithDuration: (items: unknown[]) => mockDuration(items),
  naismithDurationMin: jest.requireActual('@/features/trails-acquisition/services/ors').naismithDurationMin,
}))
jest.mock('@/features/trails-acquisition/services/ign-places', () => ({ findIgnPlace: (...args: unknown[]) => mockIgnPlace(...args) }))
jest.mock('@/features/trails-acquisition/services/ign', () => ({
  enrichCandidatesWithIgn: async (items: Array<{ elevation_gain_m: number | null }>) => {
    await mockIgnEnrich(items)
    for (const item of items) item.elevation_gain_m = 532
    return { enriched: items.length, errors: 0 }
  },
}))
jest.mock('@/features/trails-acquisition/services/camptocamp-photos', () => ({
  enrichCandidatesWithTrailPhotos: (items: unknown[]) => mockPhotos(items),
  findCamptocampPhotos: jest.fn(),
}))
jest.mock('@/features/trails-acquisition/services/geotrek-photos', () => ({ createGeotrekPhotoFinder: () => jest.fn() }))
jest.mock('@/features/trails-acquisition/services/tourism-site-photos', () => ({ createTourismSitePhotoFinder: () => jest.fn() }))
jest.mock('@/features/transport/travel-times', () => ({ computeDrivingAccess: () => mockDriving() }))

import { completeTrailCandidates, type CompletableTrail } from '@/features/trails-acquisition/services/complete-candidates'

const city = { name: 'Les Contamines-Montjoie', latitude: 45.8214, longitude: 6.7272 }
const trail = (overrides: Partial<CompletableTrail> = {}): CompletableTrail => ({
  id: 't1', title: "Lac d'Armancette", primary_source_type: 'gemini', source_refs: [], raw_payload: null,
  distance_km: null, elevation_gain_m: null, estimated_duration_min: null, loop_type: null,
  start_latitude: 45.816873, start_longitude: 6.726345, geometry_geojson: null,
  geometry_status: 'missing', elevation_status: 'missing', metric_source: null,
  ...overrides,
})
const lake = { name: "Lac d'Armancette", coord: [6.75258, 45.81606] as [number, number] }
const traced = { coordinates: [[6.726345, 45.816873], [6.74, 45.817], [6.75258, 45.81606]] as Array<[number, number]>, distanceKm: 2.7 }

// Spec 102 — complétion des randonnées à revoir.
describe('102 — completeTrailCandidates', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    mockIgnPlace.mockResolvedValue(lake)
    mockRoute.mockResolvedValue(traced)
  })
  afterEach(() => jest.restoreAllMocks())

  it('AC-01-03 / AC-01-04 / AC-01-09 : tracé calculé à vérifier, distance aller-retour, D+ IGN, durée Naismith', async () => {
    const [result] = await completeTrailCandidates([trail()], city)
    expect(mockRoute).toHaveBeenCalledWith([6.726345, 45.816873], [6.75258, 45.81606])
    expect(result!.candidate).toMatchObject({
      geometry_geojson: { type: 'LineString', coordinates: traced.coordinates },
      geometry_status: 'needs_review',
      distance_km: 5.4,
      loop_type: 'out_and_back',
      elevation_gain_m: 532,
      estimated_duration_min: 118,
    })
    expect(result!.candidate.source_refs).toContainEqual(expect.objectContaining({ type: 'ors_route', used_for: ['geometry'] }))
    expect(mockDuration.mock.calls[0]![0]).toEqual([])
  })

  it('AC-01-06 : un tracé existant n’est jamais recalculé, un D+ présent jamais remplacé', async () => {
    const [result] = await completeTrailCandidates([trail({
      geometry_status: 'valid', geometry_geojson: { type: 'MultiLineString', coordinates: [[[6.72, 45.81], [6.75, 45.81]]] },
      elevation_gain_m: 900, elevation_status: 'valid', distance_km: 6,
    })], city)
    expect(mockRoute).not.toHaveBeenCalled()
    expect(mockIgnEnrich.mock.calls[0]![0]).toEqual([])
    expect(result!.candidate).toMatchObject({ elevation_gain_m: 900, distance_km: 6 })
  })

  it('AC-01-08 : une boucle n’a pas de tracé calculé', async () => {
    const [result] = await completeTrailCandidates([trail({ title: 'Tour du Val Montjoie' })], city)
    expect(mockRoute).not.toHaveBeenCalled()
    expect(result!.changes).toContain('boucle : tracé non calculé (un aller-retour ne la représente pas)')
  })

  it('AC-01-09 : aller plus long que la distance annoncée → tracé écarté', async () => {
    mockRoute.mockResolvedValue({ ...traced, distanceKm: 3.7 })
    const [result] = await completeTrailCandidates([trail({ distance_km: 2.2 })], city)
    expect(result!.candidate.geometry_status).toBe('missing')
    expect(result!.changes).toContain('tracé calculé écarté (3.7 km aller pour 2.2 km annoncés)')
  })

  it('AC-01-07 : départ à plus de 45 min de route → hors zone, sans modification', async () => {
    mockIgnPlace.mockResolvedValue(null)
    mockDriving.mockResolvedValueOnce({ t1: { seconds: 146 * 60 } } as never)
    const [result] = await completeTrailCandidates([trail({ title: 'Col inconnu' })], city)
    expect(result).toMatchObject({ drivingMinutes: 146, outOfZone: true })
  })

  it('ORS en échec → la randonnée reste sans tracé, sans planter', async () => {
    mockRoute.mockRejectedValue(new Error('ORS HTTP 429'))
    const [result] = await completeTrailCandidates([trail()], city)
    expect(result!.candidate.geometry_status).toBe('missing')
  })
})
