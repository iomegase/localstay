import { NextRequest } from 'next/server'

const mockRun = jest.fn()
jest.mock('@/features/events-acquisition/services/ingest-runner', () => ({
  runEventIngestion: (...a: unknown[]) => mockRun(...a),
}))

import { GET } from '@/app/api/internal/ingest-events/route'

const SECRET = 'test-internal-secret'

function req(auth?: string): NextRequest {
  return new NextRequest('http://localhost/api/internal/ingest-events', {
    method: 'GET',
    headers: auth ? { authorization: auth } : {},
  })
}

describe('GET /api/internal/ingest-events', () => {
  const realSecret = process.env.INTERNAL_API_SECRET
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.INTERNAL_API_SECRET = SECRET
  })
  afterAll(() => {
    if (realSecret === undefined) delete process.env.INTERNAL_API_SECRET
    else process.env.INTERNAL_API_SECRET = realSecret
  })

  it('401 sans Bearer valide et ne lance pas le runner', async () => {
    const res = await GET(req())
    expect(res.status).toBe(401)
    expect(mockRun).not.toHaveBeenCalled()
  })

  it('200 avec Bearer valide et renvoie le résumé', async () => {
    mockRun.mockResolvedValue({ fetched: 3, matched: 2, upserted: 2, skipped: 1, deleted: 0 })
    const res = await GET(req(`Bearer ${SECRET}`))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: { fetched: 3, matched: 2, upserted: 2, skipped: 1, deleted: 0 } })
    expect(mockRun).toHaveBeenCalledWith({ source: 'cron' })
  })
})
