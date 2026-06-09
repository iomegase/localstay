import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const mockSession = jest.fn()
jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: (...a: unknown[]) => mockSession(...a),
}))
const mockRun = jest.fn()
jest.mock('@/features/events-acquisition/services/ingest-runner', () => ({
  runEventIngestion: (...a: unknown[]) => mockRun(...a),
}))
const mockList = jest.fn()
jest.mock('@/features/events-acquisition/queries/events', () => ({
  listEvents: (...a: unknown[]) => mockList(...a),
}))

import { POST } from '@/app/api/admin/events/fetch/route'
import { GET } from '@/app/api/admin/events/route'

function postReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/admin/events/fetch', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockSession.mockResolvedValue({ user: { id: 'admin-1' }, error: null })
})

describe('POST /api/admin/events/fetch', () => {
  it('refuse si non-admin', async () => {
    mockSession.mockResolvedValue({ user: null, error: NextResponse.json({ error: 'x' }, { status: 403 }) })
    const res = await POST(postReq({ commune: 'chamonix' }))
    expect(res.status).toBe(403)
    expect(mockRun).not.toHaveBeenCalled()
  })

  it('400 si commune manquante', async () => {
    const res = await POST(postReq({}))
    expect(res.status).toBe(400)
    expect(mockRun).not.toHaveBeenCalled()
  })

  it('lance le runner avec la commune + rayon par défaut (10) et renvoie le résumé', async () => {
    mockRun.mockResolvedValue({ fetched: 5, matched: 3, upserted: 3, skipped: 2, deleted: 1 })
    const res = await POST(postReq({ commune: 'chamonix' }))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: { fetched: 5, matched: 3, upserted: 3, skipped: 2, deleted: 1 } })
    expect(mockRun).toHaveBeenCalledWith({ communeFilter: 'chamonix', radiusKm: 10, source: 'admin' })
  })

  it('passe le rayon fourni par l’admin au runner', async () => {
    mockRun.mockResolvedValue({ fetched: 0, matched: 0, upserted: 0, skipped: 0, deleted: 0 })
    const res = await POST(postReq({ commune: 'chamonix', radiusKm: 25 }))
    expect(res.status).toBe(200)
    expect(mockRun).toHaveBeenCalledWith({ communeFilter: 'chamonix', radiusKm: 25, source: 'admin' })
  })

  it('rejette un rayon hors bornes (1–50)', async () => {
    const res = await POST(postReq({ commune: 'chamonix', radiusKm: 999 }))
    expect(res.status).toBe(400)
    expect(mockRun).not.toHaveBeenCalled()
  })
})

describe('GET /api/admin/events', () => {
  it('renvoie la liste pour un admin', async () => {
    mockList.mockResolvedValue([{ id: 'e1', title: 'X' }])
    const res = await GET()
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: [{ id: 'e1', title: 'X' }] })
  })
})
