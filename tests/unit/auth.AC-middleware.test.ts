// tests/unit/auth.AC-middleware.test.ts
/**
 * AC-02-03 — Accès dashboard sans auth → redirect /auth/login
 * AC-02-04 / BR-10 — Rôle absent, inconnu ou tourist → redirect /auth/login
 * BR-04 — Cross-role access → redirect vers dashboard propre au rôle
 */

import { NextRequest } from 'next/server'

// Mock createSupabaseMiddlewareClient before importing middleware
const mockGetUser = jest.fn()

jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseMiddlewareClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}))

import { proxy as middleware } from '../../src/proxy'

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

  it.each([
    { caseName: 'an absent role on /dashboard', userMetadata: {}, path: '/dashboard' },
    { caseName: 'an unknown role on /merchant', userMetadata: { role: 'legacy' }, path: '/merchant' },
    { caseName: 'the tourist role on /admin', userMetadata: { role: 'tourist' }, path: '/admin' },
  ])(
    'redirects an authenticated user with $caseName to /auth/login (AC-02-04/BR-10)',
    async ({ userMetadata, path }) => {
      mockGetUser.mockResolvedValue({
        data: { user: { user_metadata: userMetadata } },
      })
      const res = await middleware(makeRequest(path))
      expect(res.status).toBe(307)
      const location = res.headers.get('location')
      expect(location).not.toBeNull()
      expect(new URL(location as string).pathname).toBe('/auth/login')
    },
  )
})

describe('middleware — QR séjour : /guide/:slug?lodging=:id', () => {
  const VALID_UUID = '11111111-2222-4333-8444-555555555555'

  beforeEach(() => jest.clearAllMocks())

  it('redirects to the private welcome home and sets the lodging cookie when ?lodging= is a valid UUID', async () => {
    const res = await middleware(
      makeRequest(`/guide/chamonix?lodging=${VALID_UUID}`),
    )
    expect(res.status).toBe(307)
    const location = res.headers.get('location')
    expect(location).not.toBeNull()
    const url = new URL(location as string)
    expect(url.pathname).toBe('/sejour')
    // ?lodging= is carried so the private home can record the qr_scan event.
    expect(url.searchParams.get('lodging')).toBe(VALID_UUID)
    expect(res.cookies.get('lodging_id')?.value).toBe(VALID_UUID)
  })

  it('does NOT redirect deeper in-guide navigation (category/POI) but keeps refreshing the cookie', async () => {
    // Les liens internes en mode séjour portent ?lodging= ; ils ne doivent pas
    // renvoyer le guest vers la home lorsque le cookie actif correspond.
    const res = await middleware(
      new NextRequest(
        `http://localhost:3000/guide/chamonix/boulangerie?lodging=${VALID_UUID}`,
        { headers: { cookie: `lodging_id=${VALID_UUID}` } },
      ),
    )
    expect(res.status).toBe(200)
    expect(res.cookies.get('lodging_id')?.value).toBe(VALID_UUID)
  })

  it('does not redirect when /guide/ has no ?lodging= param', async () => {
    const res = await middleware(makeRequest('/guide/chamonix'))
    expect(res.status).toBe(200)
    expect(res.cookies.get('lodging_id')).toBeUndefined()
  })

  it('does not redirect nor set a cookie when ?lodging= is not a valid UUID', async () => {
    const res = await middleware(makeRequest('/guide/chamonix?lodging=not-a-uuid'))
    expect(res.status).toBe(200)
    expect(res.cookies.get('lodging_id')).toBeUndefined()
  })
})
