// tests/unit/auth.AC-middleware.test.ts
/**
 * AC-02-03 — Accès dashboard sans auth → redirect /auth/login
 * BR-04 — Cross-role access → redirect vers dashboard propre au rôle
 */

import { NextRequest, NextResponse } from 'next/server'

// Mock createSupabaseMiddlewareClient before importing middleware
const mockGetUser = jest.fn()

jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseMiddlewareClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}))

import { middleware } from '../../src/middleware'

function makeRequest(path: string): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`)
}

describe('middleware — AC-02-03 + BR-04', () => {
  beforeEach(() => jest.clearAllMocks())

  it('redirects unauthenticated user from /dashboard to /auth/login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await middleware(makeRequest('/dashboard'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/auth/login')
  })

  it('redirects unauthenticated user from /merchant to /auth/login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await middleware(makeRequest('/merchant'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/auth/login')
  })

  it('allows owner to access /dashboard', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { user_metadata: { role: 'owner' } } },
    })
    const res = await middleware(makeRequest('/dashboard'))
    expect(res.status).toBe(200)
  })

  it('redirects owner attempting /merchant to /dashboard (BR-04)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { user_metadata: { role: 'owner' } } },
    })
    const res = await middleware(makeRequest('/merchant'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/dashboard')
  })

  it('allows merchant to access /merchant', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { user_metadata: { role: 'merchant' } } },
    })
    const res = await middleware(makeRequest('/merchant'))
    expect(res.status).toBe(200)
  })
})
