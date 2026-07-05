const mockGetSessionAdmin = jest.fn()
const mockFindUnique = jest.fn()
const mockTransaction = jest.fn()
const mockHardDeleteLodging = jest.fn().mockResolvedValue(undefined)

jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: () => mockGetSessionAdmin() }))
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: { findUnique: (...a: unknown[]) => mockFindUnique(...a) },
    $transaction: (...a: unknown[]) => mockTransaction(...a),
  },
}))
jest.mock('@/features/admin/lib/hard-delete', () => ({
  hardDeleteLodging: (...a: unknown[]) => mockHardDeleteLodging(...a),
}))

import { DELETE } from '@/app/api/admin/lodgings/[id]/route'

const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
const VALID = '039c55cb-57f0-4816-9b0d-460d80e4e04f'

describe('DELETE /api/admin/lodgings/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ error: null })
    mockTransaction.mockImplementation(async (fn: (c: unknown) => unknown) => fn({}))
    mockFindUnique.mockResolvedValue({ id: VALID })
  })

  it('returns 403 when not admin', async () => {
    const denied = new Response('no', { status: 403 })
    mockGetSessionAdmin.mockResolvedValue({ error: denied })
    const res = await DELETE(new Request('http://x'), ctx(VALID))
    expect(res.status).toBe(403)
  })

  it('returns 404 when the lodging does not exist', async () => {
    mockFindUnique.mockResolvedValue(null)
    const res = await DELETE(new Request('http://x'), ctx(VALID))
    expect(res.status).toBe(404)
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('purges the lodging and returns 200', async () => {
    const res = await DELETE(new Request('http://x'), ctx(VALID))
    expect(res.status).toBe(200)
    expect(mockHardDeleteLodging).toHaveBeenCalled()
  })
})
