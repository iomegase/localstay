import { NextRequest } from 'next/server'

const mockBatch = jest.fn()
jest.mock('@/features/poi-photos/queries/check-photo-liveness-batch', () => ({
  checkPhotoLivenessBatch: (...a: unknown[]) => mockBatch(...a),
}))

import { POST } from '@/app/api/internal/check-photo-liveness/route'

const SECRET = 'test-internal-secret'
function req(auth?: string, body: unknown = {}): NextRequest {
  return new NextRequest('http://localhost/api/internal/check-photo-liveness', {
    method: 'POST',
    headers: { ...(auth ? { authorization: auth } : {}), 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const realSecret = process.env.INTERNAL_API_SECRET
beforeEach(() => {
  jest.clearAllMocks()
  process.env.INTERNAL_API_SECRET = SECRET
})
afterAll(() => {
  if (realSecret === undefined) delete process.env.INTERNAL_API_SECRET
  else process.env.INTERNAL_API_SECRET = realSecret
})

it('returns 401 without a valid bearer and does not run the batch', async () => {
  const res = await POST(req())
  expect(res.status).toBe(401)
  expect(mockBatch).not.toHaveBeenCalled()
})

it('runs the batch with the requested limit when authorized', async () => {
  mockBatch.mockResolvedValue({ processed: 5, poisFlagged: 1, photosRemoved: 2 })
  const res = await POST(req(`Bearer ${SECRET}`, { limit: 5 }))
  expect(res.status).toBe(200)
  await expect(res.json()).resolves.toEqual({ data: { processed: 5, poisFlagged: 1, photosRemoved: 2 } })
  expect(mockBatch).toHaveBeenCalledWith(5)
})
