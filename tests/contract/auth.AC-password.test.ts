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
  beforeEach(() => jest.clearAllMocks())

  it('AC-04-01: returns 200 even when email does not exist', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'User not found' } })
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
