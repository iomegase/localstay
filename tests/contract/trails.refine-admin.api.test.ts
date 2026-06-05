import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockRefineBatch = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: () => mockGetSessionAdmin(),
}))
jest.mock('@/features/trails-acquisition/queries/refine-geometry', () => ({
  refinePendingTrailGeometries: (...a: unknown[]) => mockRefineBatch(...a),
}))

import { POST } from '@/app/api/admin/trails/refine-geometry/route'

const admin = { id: 'admin-1', role: 'admin' }
const req = () => new NextRequest('http://localhost/api/admin/trails/refine-geometry', { method: 'POST' })

describe('POST /api/admin/trails/refine-geometry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: admin, error: null })
  })

  it('runs the refine batch for an authenticated admin', async () => {
    mockRefineBatch.mockResolvedValue({ processed: 5, refined: 4, skipped: 1 })

    const res = await POST(req())
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: { processed: 5, refined: 4, skipped: 1 } })
    expect(mockRefineBatch).toHaveBeenCalled()
  })

  it('passes through the admin auth error without running the batch', async () => {
    const error = Response.json(
      { error: { code: 'FORBIDDEN', message: 'Accès réservé aux administrateurs', details: {} } },
      { status: 403 },
    )
    mockGetSessionAdmin.mockResolvedValue({ user: null, error })

    const res = await POST(req())
    expect(res.status).toBe(403)
    expect(mockRefineBatch).not.toHaveBeenCalled()
  })
})
