import { NextRequest } from 'next/server'

const mockRefineBatch = jest.fn()
jest.mock('@/features/trails-acquisition/queries/refine-geometry', () => ({
  refinePendingTrailGeometries: (...a: unknown[]) => mockRefineBatch(...a),
}))

import { GET } from '@/app/api/internal/refine-trail-geometry/route'

const SECRET = 'test-internal-secret'

function req(auth?: string): NextRequest {
  return new NextRequest('http://localhost/api/internal/refine-trail-geometry', {
    method: 'GET',
    headers: auth ? { authorization: auth } : {},
  })
}

describe('GET /api/internal/refine-trail-geometry', () => {
  const realSecret = process.env.INTERNAL_API_SECRET

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.INTERNAL_API_SECRET = SECRET
  })
  afterAll(() => {
    if (realSecret === undefined) delete process.env.INTERNAL_API_SECRET
    else process.env.INTERNAL_API_SECRET = realSecret
  })

  it('returns 401 without a valid bearer secret and does not run the batch', async () => {
    const res = await GET(req())
    expect(res.status).toBe(401)
    expect(mockRefineBatch).not.toHaveBeenCalled()
  })

  it('runs the batch and returns its result when authorized', async () => {
    mockRefineBatch.mockResolvedValue({ processed: 3, refined: 2, skipped: 1 })

    const res = await GET(req(`Bearer ${SECRET}`))
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: { processed: 3, refined: 2, skipped: 1 } })
    expect(mockRefineBatch).toHaveBeenCalled()
  })
})
