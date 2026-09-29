// tests/contract/auth.AC-register.test.ts
import { NextRequest } from 'next/server'
const mockRegisterWithResend = jest.fn()
jest.mock('../../src/features/auth/lib/registration-email', () => ({
  registerWithResend: (...args: unknown[]) => mockRegisterWithResend(...args),
}), { virtual: true })

jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseRouteClient: jest.fn(() => ({
    auth: { signUp: jest.fn() },
  })),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    user: { create: jest.fn(), findUnique: jest.fn() },
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
    jest.spyOn(console, 'error').mockImplementation(() => {})
    mockRegisterWithResend.mockResolvedValue({ status: 'unavailable' })
    jest.mocked(prisma.user.findUnique).mockResolvedValue(null)

    // Re-wire the supabase mock's signUp after clearAllMocks
    mockSignUp = jest.fn().mockResolvedValue({
      data: { user: { id: 'supabase-uid-1' }, session: { access_token: 'test-session' } },
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
  afterEach(() => jest.restoreAllMocks())

  it('AC-01-01: returns 201 with AuthResult on valid input', async () => {
    const res = await POST(makeRegisterRequest(validBody))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.user.email).toBe('owner@test.com')
    expect(json.user.role).toBe('owner')
    expect(json.redirect_to).toBe('/dashboard')
    expect(json.subscription.status).toBe('trial')
    expect(json.confirmation_required).toBe(false)
  })

  it('AC-01-05: native registration without a session requires email confirmation', async () => {
    mockSignUp.mockResolvedValue({ data: { user: { id: 'supabase-uid-1' }, session: null }, error: null })
    const res = await POST(makeRegisterRequest(validBody))
    expect(res.status).toBe(201)
    expect(await res.json()).toMatchObject({ confirmation_required: true })
    expect(mockSignUp).toHaveBeenCalledWith(expect.objectContaining({
      options: expect.objectContaining({ emailRedirectTo: expect.stringMatching(/\/auth\/confirm-registration$/) }),
    }))
  })

  it('AC-01-01/05: a confirmation email failure uses Resend without automatically confirming the account', async () => {
    mockSignUp.mockResolvedValue({ data: { user: null, session: null }, error: { status: 500, code: 'unexpected_failure', message: 'Error sending confirmation email' } })
    mockRegisterWithResend.mockResolvedValue({ status: 'sent', user: { id: 'supabase-uid-fallback' } })
    const res = await POST(makeRegisterRequest(validBody))
    expect(res.status).toBe(201)
    expect(await res.json()).toMatchObject({ confirmation_required: true })
    expect(mockRegisterWithResend).toHaveBeenCalledWith(validBody, expect.stringMatching(/\/auth\/confirm-registration$/))
    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ supabase_id: 'supabase-uid-fallback', role: 'owner' }) }))
    expect(prisma.subscription.create).toHaveBeenCalledTimes(1)
  })

  it('AC-01-01: Resend rejection does not announce success or expose the provider message', async () => {
    mockSignUp.mockResolvedValue({ data: { user: null }, error: { status: 500, message: 'Error sending confirmation email: private SMTP details' } })
    const res = await POST(makeRegisterRequest(validBody))
    expect(res.status).toBe(503)
    expect(await res.json()).toMatchObject({ error: { code: 'EMAIL_SEND_FAILED' } })
    expect(prisma.user.create).not.toHaveBeenCalled()
    expect(prisma.subscription.create).not.toHaveBeenCalled()
  })

  it.each([401, 429])('AC-01-01: provider refusal %s cannot use the privileged signup fallback', async status => {
    mockSignUp.mockResolvedValue({ data: { user: null }, error: { status, message: 'Provider refusal' } })
    const res = await POST(makeRegisterRequest(validBody))
    expect(res.status).toBe(status === 429 ? 429 : 500)
    expect(mockRegisterWithResend).not.toHaveBeenCalled()
  })

  it('AC-01-02: a stored account is rejected before signup or a role change', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'existing-account' } as never)
    const res = await POST(makeRegisterRequest(validBody))
    expect(res.status).toBe(409)
    expect(mockSignUp).not.toHaveBeenCalled()
    expect(mockRegisterWithResend).not.toHaveBeenCalled()
  })

  it('AC-01-02: an obfuscated Supabase duplicate is rejected without creating a second account', async () => {
    mockSignUp.mockResolvedValue({ data: { user: { id: 'obfuscated', identities: [] }, session: null }, error: null })
    const res = await POST(makeRegisterRequest(validBody))
    expect(res.status).toBe(409)
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it('AC-01-01: database failures do not trigger the email fallback or leak raw details', async () => {
    mockSignUp.mockResolvedValue({ data: { user: null }, error: { status: 500, message: 'private database details' } })
    const res = await POST(makeRegisterRequest(validBody))
    expect(res.status).toBe(500)
    expect(mockRegisterWithResend).not.toHaveBeenCalled()
    expect(JSON.stringify(await res.json())).not.toContain('private database')
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
    const body: Partial<typeof validBody> = { ...validBody }
    delete body.first_name
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
