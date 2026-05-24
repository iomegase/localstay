import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockCreateAcquisitionRun = jest.fn()
const mockGetAcquisitionRun = jest.fn()
const mockListAcquisitionRuns = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: () => mockGetSessionAdmin(),
}))

jest.mock('@/features/poi-acquisition/queries/runs', () => ({
  createAcquisitionRun: (...args: unknown[]) => mockCreateAcquisitionRun(...args),
  getAcquisitionRun: (...args: unknown[]) => mockGetAcquisitionRun(...args),
  listAcquisitionRuns: (...args: unknown[]) => mockListAcquisitionRuns(...args),
}))

import { GET, POST } from '@/app/api/admin/poi-acquisition/runs/route'
import { GET as detailGET } from '@/app/api/admin/poi-acquisition/runs/[id]/route'

function request(body: object) {
  return new NextRequest('http://localhost/api/admin/poi-acquisition/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('018 admin acquisition runs API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('AC-01-01: creates a running acquisition run for active city/category', async () => {
    mockCreateAcquisitionRun.mockResolvedValue({ id: 'run-1', status: 'running' })

    const res = await POST(request({ city_id: 'city-1', category_id: 'cat-1' }))

    expect(res.status).toBe(201)
    expect(mockCreateAcquisitionRun).toHaveBeenCalledWith({ city_id: 'city-1', category_id: 'cat-1' }, 'admin-1')
  })

  it('AC-01-02/01-03/01-04/01-05: returns run candidates with acquisition statuses', async () => {
    mockGetAcquisitionRun.mockResolvedValue({
      id: 'run-1',
      status: 'completed',
      candidates: [
        {
          id: 'cand-1',
          source: 'gemini',
          google_place_id: 'place-1',
          match_status: 'matched',
          geocode_status: 'success',
          review_status: 'needs_review',
        },
      ],
    })

    const res = await detailGET(new NextRequest('http://localhost/api/admin/poi-acquisition/runs/run-1'), {
      params: Promise.resolve({ id: 'run-1' }),
    })

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      data: expect.objectContaining({
        candidates: [expect.objectContaining({ source: 'gemini', match_status: 'matched' })],
      }),
    })
  })

  it('lists acquisition runs for admins', async () => {
    mockListAcquisitionRuns.mockResolvedValue([{ id: 'run-1', status: 'completed' }])

    const res = await GET()

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: [{ id: 'run-1', status: 'completed' }] })
  })
})
