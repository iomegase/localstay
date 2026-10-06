const mockRunFindFirst = jest.fn()
const mockRunFindMany = jest.fn()
const mockRunUpdate = jest.fn()
const mockCandidateCreate = jest.fn()
const mockPoiFindMany = jest.fn()
const mockCallGemini = jest.fn()
const mockGeocode = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    poiAcquisitionRun: {
      findFirst: (...a: unknown[]) => mockRunFindFirst(...a),
      findMany: (...a: unknown[]) => mockRunFindMany(...a),
      update: (...a: unknown[]) => mockRunUpdate(...a),
    },
    poiAcquisitionCandidate: { create: (...a: unknown[]) => mockCandidateCreate(...a) },
    pointOfInterest: { findMany: (...a: unknown[]) => mockPoiFindMany(...a) },
  },
}))
jest.mock('@/features/gemini-fetch/services/gemini-client', () => ({ callGemini: (...a: unknown[]) => mockCallGemini(...a) }))
jest.mock('@/features/poi-acquisition/lib/geocode', () => ({ geocodeForAcquisition: (...a: unknown[]) => mockGeocode(...a) }))

import { serializePendingPlaces } from '@/features/poi-acquisition/lib/pending-places'
import { markStalledRuns, processPendingCandidates, resumeAcquisitionRun } from '@/features/poi-acquisition/queries/runs'

// Spec 072 — traitement par lots reprenables.
function place(index: number) {
  return {
    name: `Lieu ${index}`, address: `${index} rue`, phone: null, website: null, google_place_id: `gp-${index}`,
    review_payload: null, google_review_expires_at: null, hours: null, query_subcategory_name: null,
    business_status: 'OPERATIONAL' as const, location: null,
  }
}

function runRow(pending: unknown, status = 'running') {
  return {
    id: 'run-1', status, error: null, source_url: null, pending_places: pending, processed_count: 0,
    city: { id: 'city-sg', name: 'Saint-Gervais-les-Bains', latitude: 45.89, longitude: 6.71 },
    category: { id: 'cat-diner', name: 'Restaurant', subcategories: [] },
    candidates: [],
  }
}

describe('072 — traitement par lots', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRunUpdate.mockResolvedValue({})
    mockPoiFindMany.mockResolvedValue([])
    mockCallGemini.mockResolvedValue([{ description: 'D' }])
    mockGeocode.mockResolvedValue({ status: 'success', latitude: 45.89, longitude: 6.71, confidence: 0.9 })
    mockCandidateCreate.mockResolvedValue({})
  })

  it('AC-01-02 : lots de 5 en parallèle, run mis à jour après chaque lot', async () => {
    const places = Array.from({ length: 12 }, (_, index) => place(index))
    mockRunFindFirst.mockResolvedValue(runRow(serializePendingPlaces(places)))
    let active = 0
    let maxActive = 0
    mockGeocode.mockImplementation(async () => {
      active += 1
      maxActive = Math.max(maxActive, active)
      await new Promise(resolve => setTimeout(resolve, 5))
      active -= 1
      return { status: 'success', latitude: 45.89, longitude: 6.71, confidence: 0.9 }
    })

    const result = await processPendingCandidates('run-1', { deadline: Date.now() + 60_000 })

    expect(maxActive).toBe(5)
    expect(mockCandidateCreate).toHaveBeenCalledTimes(12)
    const progress = mockRunUpdate.mock.calls.map(call => call[0].data).filter(data => 'pending_places' in data && !('status' in data))
    expect(progress.map(data => (data.pending_places as unknown[]).length)).toEqual([7, 2, 0])
    expect(progress.map(data => data.processed_count)).toEqual([{ increment: 5 }, { increment: 5 }, { increment: 2 }])
    expect(mockRunUpdate.mock.calls.at(-1)![0].data).toMatchObject({ status: 'completed' })
    expect(result).toEqual({ processed: 12, remaining: 0, status: 'completed' })
  })

  it('AC-01-03 : budget atteint → aucun nouveau lot, run partiel', async () => {
    mockRunFindFirst.mockResolvedValue(runRow(serializePendingPlaces(Array.from({ length: 12 }, (_, index) => place(index)))))
    let clock = 0
    const now = () => clock
    mockCandidateCreate.mockImplementation(async () => { clock += 30 })

    const result = await processPendingCandidates('run-1', { deadline: 100, now })

    expect(mockCandidateCreate).toHaveBeenCalledTimes(5)
    expect(result).toEqual({ processed: 5, remaining: 7, status: 'partial' })
    expect(mockRunUpdate.mock.calls.at(-1)![0].data).toMatchObject({ status: 'partial' })
  })

  it('AC-01-04 : un échec n’empêche pas les autres candidats du lot', async () => {
    mockRunFindFirst.mockResolvedValue(runRow(serializePendingPlaces([place(1), place(2), place(3)])))
    mockCandidateCreate
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('contrainte'))
      .mockResolvedValueOnce({})

    const result = await processPendingCandidates('run-1', { deadline: Date.now() + 60_000 })

    expect(result).toEqual({ processed: 3, remaining: 0, status: 'completed' })
    expect(mockRunUpdate.mock.calls.at(-1)![0].data.error).toContain('Lieu 2: contrainte')
  })

  it('BR-04 : les données Google en attente sont relues fidèlement (dates comprises)', async () => {
    const expires = new Date('2026-11-01T00:00:00.000Z')
    mockRunFindFirst.mockResolvedValue(runRow(serializePendingPlaces([{ ...place(1), google_review_expires_at: expires }])))

    await processPendingCandidates('run-1', { deadline: Date.now() + 60_000 })

    expect(mockCandidateCreate.mock.calls[0]![0].data).toMatchObject({ google_place_id: 'gp-1', google_review_expires_at: expires })
  })
})

describe('072 US-02 — reprise', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRunUpdate.mockResolvedValue({})
    mockRunFindMany.mockResolvedValue([])
    mockPoiFindMany.mockResolvedValue([])
    mockCallGemini.mockResolvedValue([{ description: 'D' }])
    mockGeocode.mockResolvedValue({ status: 'success', latitude: 45.89, longitude: 6.71, confidence: 0.9 })
    mockCandidateCreate.mockResolvedValue({})
  })

  it('AC-02-01 : un run partiel reprend les lieux restants, sans recherche Google', async () => {
    global.fetch = jest.fn()
    mockRunFindFirst.mockResolvedValue(runRow(serializePendingPlaces([place(1), place(2)]), 'partial'))

    await resumeAcquisitionRun('run-1')

    expect(mockRunUpdate.mock.calls[0]![0]).toEqual({ where: { id: 'run-1' }, data: { status: 'running' } })
    expect(mockCandidateCreate).toHaveBeenCalledTimes(2)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('AC-02-02 : un run terminé n’est pas reprenable', async () => {
    mockRunFindFirst.mockResolvedValue(runRow([], 'completed'))
    await expect(resumeAcquisitionRun('run-1')).rejects.toMatchObject({ code: 'RUN_NOT_RESUMABLE', status: 409 })
  })

  it('run introuvable → 404', async () => {
    mockRunFindFirst.mockResolvedValue(null)
    await expect(resumeAcquisitionRun('run-x')).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
  })
})

describe('072 US-03 — runs bloqués', () => {
  beforeEach(() => jest.clearAllMocks())

  it('AC-03-01 : un run sans nouvelle depuis 10 min passe en partiel (ou terminé sans reste)', async () => {
    const now = new Date('2026-10-06T10:30:00.000Z')
    mockRunFindMany.mockResolvedValue([
      { id: 'avec-reste', pending_places: serializePendingPlaces([place(1)]), error: null },
      { id: 'sans-reste', pending_places: [], error: null },
    ])
    mockRunUpdate.mockResolvedValue({})

    await markStalledRuns(now)

    expect(mockRunFindMany.mock.calls[0]![0].where).toEqual({
      deleted_at: null, status: 'running', updated_at: { lt: new Date('2026-10-06T10:20:00.000Z') },
    })
    expect(mockRunUpdate).toHaveBeenCalledWith({ where: { id: 'avec-reste' }, data: expect.objectContaining({ status: 'partial' }) })
    expect(mockRunUpdate).toHaveBeenCalledWith({ where: { id: 'sans-reste' }, data: expect.objectContaining({ status: 'completed' }) })
  })
})
