const mockRedirect = jest.fn()
const mockGetUser = jest.fn()
const mockFindUser = jest.fn()
const mockCreateSupabasePageClient = jest.fn(async () => ({
  auth: { getUser: mockGetUser },
}))

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}))

jest.mock('@/shared/lib/supabase', () => ({
  createSupabasePageClient: (...args: unknown[]) => mockCreateSupabasePageClient(...args),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    user: { findFirst: (...args: unknown[]) => mockFindUser(...args) },
  },
}))

import { getPageOwner } from '@/features/dashboard-owner/lib/get-page-owner'

const OWNER = {
  id: 'owner-1',
  supabase_id: 'supa-1',
  email: 'owner@staylocal.dev',
  role: 'owner',
  is_active: true,
  deleted_at: null,
}

describe('getPageOwner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRedirect.mockImplementation((path: string) => {
      throw new Error(`redirect:${path}`)
    })
    mockGetUser.mockResolvedValue({ data: { user: { id: 'supa-1' } } })
    mockFindUser.mockResolvedValue(OWNER)
  })

  it('uses Supabase SSR auth instead of parsing session cookies manually', async () => {
    const owner = await getPageOwner()

    expect(mockCreateSupabasePageClient).toHaveBeenCalledTimes(1)
    expect(mockGetUser).toHaveBeenCalledTimes(1)
    expect(mockFindUser).toHaveBeenCalledWith({
      where: { supabase_id: 'supa-1', deleted_at: null, is_active: true },
    })
    expect(owner).toBe(OWNER)
  })

  it('redirects unauthenticated page requests to /auth/login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    await expect(getPageOwner()).rejects.toThrow('redirect:/auth/login')
  })

  it('redirects non-owner users to /auth/login', async () => {
    mockFindUser.mockResolvedValue({ ...OWNER, role: 'merchant' })

    await expect(getPageOwner()).rejects.toThrow('redirect:/auth/login')
  })
})
