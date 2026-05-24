// tests/contract/auth.AC-register.test.ts
import { NextRequest } from 'next/server'

jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseRouteClient: jest.fn(() => ({
    auth: { signUp: jest.fn() },
  })),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    user: { create: jest.fn() },
    subscription: { create: jest.fn() },
  },
}))

jest.mock('@/shared/lib/resend', () => ({
  sendWelcomeEmail: jest.fn(),
}))

import { POST } from '../../src/app/api/auth/register/route'
import { createSupabaseRouteClient } from '@/shared/lib/supabase'
import { prisma } from '@/shared/lib/prisma'
import { sendWelcomeEmail } from '@/shared/lib/resend'

function makeRegisterRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBody = {
  email: 'owner@test.com',
  password: 'password123',
  role: 'owner',
  first_name: 'Jean',
  last_name: 'Dupont',
}

describe('POST /api/auth/register', () => {
  let mockSignUp: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    // Re-wire the supabase mock's signUp after clearAllMocks
    mockSignUp = jest.fn().mockResolvedValue({
      data: { user: { id: 'supabase-uid-1' } },
      error: null,
    })
    jest.mocked(createSupabaseRouteClient).mockReturnValue({
      auth: { signUp: mockSignUp },
    } as never)

    jest.mocked(prisma.user.create).mockResolvedValue({
      id: 'prisma-user-1',
      email: 'owner@test.com',
      role: 'owner',
      first_name: 'Jean',
      last_name: 'Dupont',
    } as never)

    jest.mocked(prisma.subscription.create).mockResolvedValue({
      plan: 'free',
      status: 'trial',
      trial_ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    } as never)

    jest.mocked(sendWelcomeEmail).mockResolvedValue(undefined)
  })

  it('AC-01-01: returns 201 with AuthResult on valid input', async () => {
    const res = await POST(makeRegisterRequest(validBody))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.user.email).toBe('owner@test.com')
    expect(json.user.role).toBe('owner')
    expect(json.redirect_to).toBe('/dashboard')
    expect(json.subscription.status).toBe('trial')
  })

  it('AC-01-03: creates Subscription trial on register', async () => {
    await POST(makeRegisterRequest(validBody))
    expect(jest.mocked(prisma.subscription.create)).toHaveBeenCalledTimes(1)
    const callArg = jest.mocked(prisma.subscription.create).mock.calls[0][0].data
    expect(callArg.status).toBe('trial')
    expect(callArg.plan).toBe('free')
  })

  it('AC-01-04: sends welcome email on register', async () => {
    await POST(makeRegisterRequest(validBody))
    expect(jest.mocked(sendWelcomeEmail)).toHaveBeenCalledWith({
      to: 'owner@test.com',
      firstName: 'Jean',
    })
  })

  it('returns 400 when required field missing', async () => {
    const { first_name: _omit, ...body } = validBody
    const res = await POST(makeRegisterRequest(body))
    expect(res.status).toBe(400)
  })

  it('returns 400 when password too short', async () => {
    const res = await POST(makeRegisterRequest({ ...validBody, password: 'short' }))
    expect(res.status).toBe(400)
  })

  it('AC-01-02: returns 409 when email already used', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null },
      error: { message: 'User already registered', status: 422 },
    })
    const res = await POST(makeRegisterRequest(validBody))
    expect(res.status).toBe(409)
  })

  it('014 AC-01-01: returns /merchant/onboarding redirect for merchant role', async () => {
    jest.mocked(prisma.user.create).mockResolvedValue({
      id: 'prisma-user-2',
      email: 'merchant@test.com',
      role: 'merchant',
      first_name: 'Marie',
      last_name: 'Martin',
    } as never)
    const merchantBody = { ...validBody, email: 'merchant@test.com', role: 'merchant', first_name: 'Marie', last_name: 'Martin' }
    const res = await POST(makeRegisterRequest(merchantBody))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.redirect_to).toBe('/merchant/onboarding')
  })

  it('returns 500 with DB_ERROR when prisma.user.create throws', async () => {
    jest.mocked(prisma.user.create).mockRejectedValue(new Error('DB connection failed'))
    const res = await POST(makeRegisterRequest(validBody))
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error.code).toBe('DB_ERROR')
  })
})
