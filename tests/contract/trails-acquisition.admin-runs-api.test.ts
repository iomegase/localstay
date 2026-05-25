import { NextRequest } from 'next/server'
import { TrailsAcquisitionError } from '@/features/trails-acquisition/lib/errors'

const mockGetSessionAdmin = jest.fn()
const mockCreateTrailImportRun = jest.fn()
const mockGetTrailImportRun = jest.fn()
const mockListTrailImportRuns = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: () => mockGetSessionAdmin(),
}))

jest.mock('@/features/trails-acquisition/queries/runs', () => ({
  createTrailImportRun: (...args: unknown[]) => mockCreateTrailImportRun(...args),
  getTrailImportRun: (...args: unknown[]) => mockGetTrailImportRun(...args),
  listTrailImportRuns: (...args: unknown[]) => mockListTrailImportRuns(...args),
}))

import { GET, POST } from '@/app/api/admin/trails/import-runs/route'
import { GET as detailGET } from '@/app/api/admin/trails/import-runs/[id]/route'

const cityId = '11111111-1111-4111-8111-111111111111'

function request(body: object) {
  return new NextRequest('http://localhost/api/admin/trails/import-runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('019 admin trails import runs API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('returns admin auth errors unchanged', async () => {
    const error = Response.json({ error: { code: 'FORBIDDEN', message: 'Admin only', details: {} } }, { status: 403 })
    mockGetSessionAdmin.mockResolvedValue({ user: null, error })

    const res = await GET()

    expect(res.status).toBe(403)
    expect(mockListTrailImportRuns).not.toHaveBeenCalled()
  })

  it('AC-01-01: creates a running trail import run', async () => {
    mockCreateTrailImportRun.mockResolvedValue({ id: 'run-1', status: 'running' })

    const res = await POST(request({ city_id: cityId, source_types: ['official_website'] }))

    expect(res.status).toBe(201)
    expect(mockCreateTrailImportRun).toHaveBeenCalledWith(
      { city_id: cityId, source_types: ['official_website'] },
      'admin-1',
    )
    await expect(res.json()).resolves.toEqual({ data: { id: 'run-1', status: 'running' } })
  })

  it('validates import run payload before calling queries', async () => {
    const res = await POST(request({ city_id: 'not-a-uuid', source_types: [] }))

    expect(res.status).toBe(400)
    expect(mockCreateTrailImportRun).not.toHaveBeenCalled()
  })

  it('maps partial source failures through the query result', async () => {
    mockCreateTrailImportRun.mockResolvedValue({
      id: 'run-1',
      status: 'partial_success',
      source_errors: { overpass: 'timeout' },
    })

    const res = await POST(request({ city_id: cityId, source_types: ['official_website', 'overpass'] }))

    expect(res.status).toBe(201)
    await expect(res.json()).resolves.toEqual({
      data: { id: 'run-1', status: 'partial_success', source_errors: { overpass: 'timeout' } },
    })
  })

  it('lists import runs for admins', async () => {
    mockListTrailImportRuns.mockResolvedValue([{ id: 'run-1', status: 'completed', candidate_count: 2 }])

    const res = await GET()

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: [{ id: 'run-1', status: 'completed', candidate_count: 2 }] })
  })

  it('returns import run details with candidates', async () => {
    mockGetTrailImportRun.mockResolvedValue({
      id: 'run-1',
      status: 'completed',
      candidates: [{ id: 'candidate-1', primary_source_type: 'official_website', review_status: 'needs_review' }],
    })

    const res = await detailGET(new NextRequest('http://localhost/api/admin/trails/import-runs/run-1'), {
      params: Promise.resolve({ id: 'run-1' }),
    })

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      data: expect.objectContaining({
        candidates: [expect.objectContaining({ primary_source_type: 'official_website' })],
      }),
    })
  })

  it('maps domain errors to API error responses', async () => {
    mockCreateTrailImportRun.mockRejectedValue(new TrailsAcquisitionError('INVALID_CITY', 400))

    const res = await POST(request({ city_id: cityId, source_types: ['manual'] }))

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({
      error: { code: 'INVALID_CITY', message: 'Ville invalide', details: {} },
    })
  })
})
