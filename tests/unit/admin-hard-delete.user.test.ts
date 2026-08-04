const mockTransaction = jest.fn()
const mockDeleteUser = jest.fn().mockResolvedValue({ error: null })

jest.mock('@/shared/lib/prisma', () => ({
  prisma: { $transaction: (...a: unknown[]) => mockTransaction(...a) },
}))
jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseServer: () => ({
    auth: { admin: { deleteUser: (...a: unknown[]) => mockDeleteUser(...a) } },
  }),
}))

import { hardDeleteUserAccount } from '@/features/admin/lib/hard-delete'

const del = () => ({ deleteMany: jest.fn().mockResolvedValue({ count: 0 }) })

// tx couvre les delegates de hardDeleteUserAccount ET ceux du vrai hardDeleteLodging.
let tx: Record<string, unknown>

function buildTx() {
  return {
    user: { findUnique: jest.fn(), delete: jest.fn().mockResolvedValue({ id: 'u-1' }) },
    lodging: { findMany: jest.fn().mockResolvedValue([]), delete: jest.fn().mockResolvedValue({ id: 'l' }) },
    subscription: del(),
    missingPoiRequest: del(),
    merchantClaim: del(),
    merchantProfile: del(),
    contactMessage: del(),
    // enfants de hardDeleteLodging :
    lodgingPublicProfile: { findUnique: jest.fn().mockResolvedValue(null), deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    lodgingPhoto: del(),
    lodgingAmenity: del(),
    lodgingFaqItem: del(),
    qrCode: del(),
    analytics: del(),
    analyticsInteractionEvent: del(),
    lodgingCustomization: del(),
    lodgingFeaturedPoi: del(),
    lodgingPracticalBlock: del(),
    lodgingArrivalInstruction: del(),
  }
}

describe('hardDeleteUserAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    tx = buildTx()
    mockTransaction.mockImplementation(async (fn: (c: unknown) => unknown) => fn(tx))
    mockDeleteUser.mockResolvedValue({ error: null })
  })

  it('throws NOT_FOUND (404) when the user does not exist', async () => {
    ;(tx.user as { findUnique: jest.Mock }).findUnique.mockResolvedValue(null)
    await expect(hardDeleteUserAccount('missing')).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 })
    expect((tx.user as { delete: jest.Mock }).delete).not.toHaveBeenCalled()
  })

  it('purges lodgings, merchant/owner children, the user, then the Auth account', async () => {
    ;(tx.user as { findUnique: jest.Mock }).findUnique.mockResolvedValue({ id: 'u-1', supabase_id: 'sb-1' })
    ;(tx.lodging as { findMany: jest.Mock }).findMany.mockResolvedValue([{ id: 'l-1' }, { id: 'l-2' }])

    const result = await hardDeleteUserAccount('u-1')

    expect((tx.lodging as { delete: jest.Mock }).delete).toHaveBeenCalledTimes(2)
    expect((tx.merchantProfile as { deleteMany: jest.Mock }).deleteMany).toHaveBeenCalledWith({ where: { merchant_id: 'u-1' } })
    expect((tx.subscription as { deleteMany: jest.Mock }).deleteMany).toHaveBeenCalledWith({ where: { user_id: 'u-1' } })
    expect((tx.user as { delete: jest.Mock }).delete).toHaveBeenCalledWith({ where: { id: 'u-1' } })
    expect(mockDeleteUser).toHaveBeenCalledWith('sb-1')
    expect(result).toEqual({ deletedLodgings: 2, authDeleted: true })
  })

  it('reports authDeleted=false when Supabase Auth deletion fails', async () => {
    ;(tx.user as { findUnique: jest.Mock }).findUnique.mockResolvedValue({ id: 'u-1', supabase_id: 'sb-1' })
    mockDeleteUser.mockResolvedValue({ error: { message: 'boom' } })

    const result = await hardDeleteUserAccount('u-1')
    expect(result.authDeleted).toBe(false)
  })
})
