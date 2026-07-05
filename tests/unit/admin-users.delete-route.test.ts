const mockGetSessionAdmin = jest.fn()
const mockUserFindUnique = jest.fn()
const mockHardDeleteUserAccount = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: () => mockGetSessionAdmin() }))
jest.mock('@/shared/lib/prisma', () => ({
  prisma: { user: { findUnique: (...a: unknown[]) => mockUserFindUnique(...a) } },
}))
jest.mock('@/features/admin/lib/hard-delete', () => ({
  hardDeleteUserAccount: (...a: unknown[]) => mockHardDeleteUserAccount(...a),
}))

import { DELETE } from '@/app/api/admin/users/[id]/route'

const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
const VALID = '039c55cb-57f0-4816-9b0d-460d80e4e04f'

describe('DELETE /api/admin/users/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ error: null })
    mockUserFindUnique.mockResolvedValue({ id: VALID, role: 'owner' })
    mockHardDeleteUserAccount.mockResolvedValue({ deletedLodgings: 2, authDeleted: true })
  })

  it('returns 403 when not admin', async () => {
    mockGetSessionAdmin.mockResolvedValue({ error: new Response('no', { status: 403 }) })
    const res = await DELETE(new Request('http://x'), ctx(VALID))
    expect(res.status).toBe(403)
  })

  it('returns 404 when the target user does not exist', async () => {
    mockUserFindUnique.mockResolvedValue(null)
    const res = await DELETE(new Request('http://x'), ctx(VALID))
    expect(res.status).toBe(404)
    expect(mockHardDeleteUserAccount).not.toHaveBeenCalled()
  })

  it('refuses to delete an admin account (403)', async () => {
    mockUserFindUnique.mockResolvedValue({ id: VALID, role: 'admin' })
    const res = await DELETE(new Request('http://x'), ctx(VALID))
    expect(res.status).toBe(403)
    expect(mockHardDeleteUserAccount).not.toHaveBeenCalled()
  })

  it('purges an owner and returns 200 with the lodging count', async () => {
    const res = await DELETE(new Request('http://x'), ctx(VALID))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ deleted_lodgings: 2, auth_deleted: true })
    expect(mockHardDeleteUserAccount).toHaveBeenCalledWith(VALID)
  })
})
