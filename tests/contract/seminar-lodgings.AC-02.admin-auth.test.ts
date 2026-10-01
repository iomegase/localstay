import { getSessionAdmin } from '@/features/merchant/lib/session'
import { createSupabaseRouteClient } from '@/shared/lib/supabase'
import { prisma } from '@/shared/lib/prisma'
jest.mock('@/shared/lib/supabase', () => ({ createSupabaseRouteClient: jest.fn() }))
jest.mock('@/shared/lib/prisma', () => ({ prisma: { user: { findFirst: jest.fn() } } }))
const mockGetUser = jest.fn()
beforeEach(() => {
  jest.resetAllMocks()
  ;(createSupabaseRouteClient as jest.Mock).mockResolvedValue({ auth: { getUser: mockGetUser } })
  mockGetUser.mockResolvedValue({ data: { user: { id: 'supabase-user' } } })
})
it('rejects an absent authentication session with 401', async () => {
  mockGetUser.mockResolvedValue({ data: { user: null } })
  expect((await getSessionAdmin({ unavailableAccountStatus: 403 })).error?.status).toBe(401)
  expect(prisma.user.findFirst).not.toHaveBeenCalled()
})
it('requires an active, non-deleted Admin and denies unavailable accounts with 403', async () => {
  ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
  expect((await getSessionAdmin({ unavailableAccountStatus: 403 })).error?.status).toBe(403)
  expect(prisma.user.findFirst).toHaveBeenCalledWith({ where: { supabase_id: 'supabase-user', deleted_at: null, is_active: true } })
  // Preserve existing route behavior when the option is not requested.
  expect((await getSessionAdmin()).error?.status).toBe(401)
})
it.each(['owner', 'merchant'])('denies %s accounts', async role => {
  ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: 'user', role })
  expect((await getSessionAdmin({ unavailableAccountStatus: 403 })).error?.status).toBe(403)
})
it('accepts the active Admin returned by the filtered lookup', async () => {
  const user = { id: 'admin', role: 'admin' }
  ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(user)
  expect(await getSessionAdmin({ unavailableAccountStatus: 403 })).toEqual({ user, error: null })
})
