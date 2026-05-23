import { NextRequest } from 'next/server'

// Create getter functions to defer variable access
const mockSignIn = jest.fn()
const mockSignOut = jest.fn()
const mockFindUser = jest.fn()

jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseRouteClient: jest.fn(function(this: any) {
    return {
      auth: {
        signInWithPassword: mockSignIn,
        signOut: mockSignOut
      },
    }
  }),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: function(this: any) {
        return mockFindUser.apply(this, arguments as any)
      }
    },
  },
}))

import { POST as loginPOST } from '../../src/app/api/auth/login/route'
import { POST as logoutPOST } from '../../src/app/api/auth/logout/route'

function makeRequest(path: string, body: object): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSignIn.mockResolvedValue({
      data: { user: { id: 'supabase-uid-1' }, session: {} },
      error: null,
    })
    mockFindUser.mockResolvedValue({
      id: 'prisma-user-1',
      email: 'owner@test.com',
      role: 'owner',
      first_name: 'Jean',
      last_name: 'Dupont',
      subscriptions: [{ plan: 'free', status: 'trial', trial_ends_at: new Date() }],
    })
  })

  it('AC-02-01: returns 200 with AuthResult and redirect_to /dashboard for owner', async () => {
    const res = await loginPOST(makeRequest('/api/auth/login', { email: 'owner@test.com', password: 'password123' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.redirect_to).toBe('/dashboard')
    expect(json.user.role).toBe('owner')
  })

  it('AC-02-01: returns redirect_to /merchant for merchant role', async () => {
    mockFindUser.mockResolvedValue({
      id: 'prisma-user-2',
      email: 'merchant@test.com',
      role: 'merchant',
      first_name: 'Marie',
      last_name: 'Martin',
      subscriptions: [{ plan: 'free', status: 'trial', trial_ends_at: new Date() }],
    })
    const res = await loginPOST(makeRequest('/api/auth/login', { email: 'merchant@test.com', password: 'password123' }))
    const json = await res.json()
    expect(json.redirect_to).toBe('/merchant')
  })

  it('AC-02-02: returns 401 with generic message on wrong credentials', async () => {
    mockSignIn.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    })
    const res = await loginPOST(makeRequest('/api/auth/login', { email: 'owner@test.com', password: 'wrongpassword123' }))
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error.message).toBe('Email ou mot de passe incorrect')
  })

  it('returns 400 on invalid input', async () => {
    const res = await loginPOST(makeRequest('/api/auth/login', { email: 'not-an-email' }))
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/logout', () => {
  it('AC-03-01: returns 200 and calls signOut', async () => {
    mockSignOut.mockResolvedValue({ error: null })
    const res = await logoutPOST(new NextRequest('http://localhost:3000/api/auth/logout', { method: 'POST' }))
    expect(res.status).toBe(200)
    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })
})
