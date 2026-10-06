import { NextRequest } from 'next/server'
import { PoiAcquisitionError } from '@/features/poi-acquisition/lib/errors'

const mockSession = jest.fn()
const mockResume = jest.fn()
jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: () => mockSession() }))
jest.mock('@/features/poi-acquisition/queries/runs', () => ({
  resumeAcquisitionRun: (...args: unknown[]) => mockResume(...args),
  createAcquisitionRun: jest.fn(),
  listAcquisitionRuns: jest.fn(),
}))

import { POST, maxDuration } from '@/app/api/admin/poi-acquisition/runs/[id]/resume/route'
import { maxDuration as launchMaxDuration } from '@/app/api/admin/poi-acquisition/runs/route'

// Spec 072 US-02 — route de reprise.
const params = { params: Promise.resolve({ id: 'run-1' }) }
const request = () => new NextRequest('http://localhost/api/admin/poi-acquisition/runs/run-1/resume', { method: 'POST' })

describe('072 — POST /runs/{id}/resume', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('AC-01-03 : lancement et reprise disposent de 300 s', () => {
    expect(maxDuration).toBe(300)
    expect(launchMaxDuration).toBe(300)
  })

  it('AC-02-01 : reprend et renvoie le détail du run', async () => {
    mockResume.mockResolvedValue({ id: 'run-1', status: 'completed' })
    const res = await POST(request(), params)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ data: { id: 'run-1', status: 'completed' } })
    expect(mockResume).toHaveBeenCalledWith('run-1')
  })

  it('AC-02-02 : run non reprenable → 409', async () => {
    mockResume.mockRejectedValue(new PoiAcquisitionError('RUN_NOT_RESUMABLE', 409))
    const res = await POST(request(), params)
    expect(res.status).toBe(409)
    expect((await res.json()).error.code).toBe('RUN_NOT_RESUMABLE')
  })
})
