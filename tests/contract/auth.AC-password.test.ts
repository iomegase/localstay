import { NextRequest } from 'next/server'

const mockResetPasswordForEmail = jest.fn()
const mockVerifyOtp = jest.fn()
const mockUpdateUser = jest.fn()

jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseRouteClient: jest.fn(() => ({
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
      verifyOtp: mockVerifyOtp,
      updateUser: mockUpdateUser,
    },
  })),
}))

import { POST as forgotPOST } from '../../src/app/api/auth/forgot-password/route'
import { POST as resetPOST } from '../../src/app/api/auth/reset-password/route'

function makeRequest(path: string, body: object): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => jest.restoreAllMocks())

  it('AC-04-01: returns 200 even when email does not exist', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    const res = await forgotPOST(makeRequest('/api/auth/forgot-password', { email: 'unknown@test.com' }))
    expect(res.status).toBe(200)
  })

  it('AC-04-01: returns 200 when email exists', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    const res = await forgotPOST(makeRequest('/api/auth/forgot-password', { email: 'owner@test.com' }))
    expect(res.status).toBe(200)
  })

  it('returns 400 when email is invalid', async () => {
    const res = await forgotPOST(makeRequest('/api/auth/forgot-password', { email: 'not-an-email' }))
    expect(res.status).toBe(400)
  })

  it('AC-04-01: returns 429 rather than false success when Supabase refuses email sending', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: { code: 'over_email_send_rate_limit', status: 429 } })
    const res = await forgotPOST(makeRequest('/api/auth/forgot-password', { email: 'owner@test.com' }))
    expect(res.status).toBe(429)
    expect(await res.json()).toMatchObject({ error: { code: 'EMAIL_RATE_LIMITED' } })
  })

  it('AC-04-01: reports unavailable email service without exposing provider details', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: { code: 'unexpected_failure', status: 500, message: 'private SMTP details' } })
    const res = await forgotPOST(makeRequest('/api/auth/forgot-password', { email: 'owner@test.com' }))
    expect(res.status).toBe(503)
    expect(JSON.stringify(await res.json())).not.toContain('private SMTP')
    expect(console.error).toHaveBeenCalledWith('[forgot-password]', { code: 'unexpected_failure', status: 500 })
  })

  it('AC-04-01: handles transport failures without an unstructured server error', async () => {
    mockResetPasswordForEmail.mockRejectedValue(new Error('private transport details'))
    const res = await forgotPOST(makeRequest('/api/auth/forgot-password', { email: 'owner@test.com' }))
    expect(res.status).toBe(503)
    expect(await res.json()).toMatchObject({ error: { code: 'EMAIL_SEND_FAILED' } })
  })

  it('AC-04-01: diagnoses an invalid API key without exposing the key, email or provider hint', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: { status: 401, message: 'Invalid API key', hint: 'private provider hint' } })
    const res = await forgotPOST(makeRequest('/api/auth/forgot-password', { email: 'owner@test.com' }))
    expect(res.status).toBe(503)
    expect(console.error).toHaveBeenCalledWith('[forgot-password]', expect.objectContaining({
      code: 'INVALID_API_KEY', status: 401,
      configuration: expect.objectContaining({ keyKind: expect.any(String) }),
    }))
    const logs = JSON.stringify((console.error as jest.Mock).mock.calls)
    expect(logs).not.toContain('owner@test.com')
    expect(logs).not.toContain('private provider hint')
    if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) expect(logs).not.toContain(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  })
})

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => jest.clearAllMocks())

  it('AC-04-02: returns 200 when token + password are valid', async () => {
    mockVerifyOtp.mockResolvedValue({ error: null })
    mockUpdateUser.mockResolvedValue({ error: null })
    const res = await resetPOST(makeRequest('/api/auth/reset-password', { token: 'valid-token', password: 'newpassword123' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('returns 400 when token is invalid or expired', async () => {
    mockVerifyOtp.mockResolvedValue({ error: { message: 'Token expired' } })
    const res = await resetPOST(makeRequest('/api/auth/reset-password', { token: 'expired-token', password: 'newpassword123' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when password too short', async () => {
    const res = await resetPOST(makeRequest('/api/auth/reset-password', { token: 'tok', password: 'short' }))
    expect(res.status).toBe(400)
  })
})
