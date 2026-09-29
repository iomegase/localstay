import { NextRequest } from 'next/server'
const mockVerifyOtp = jest.fn()
const mockExchangeCodeForSession = jest.fn()
jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseRouteClient: () => ({ auth: { verifyOtp: mockVerifyOtp, exchangeCodeForSession: mockExchangeCodeForSession } }),
}))

function request(body: object) {
  return new NextRequest('https://www.mystay.city/api/auth/confirm-registration', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}
async function confirm(body: object) {
  const { POST } = await import('../../src/app/api/auth/confirm-registration/route')
  return POST(request(body))
}
beforeEach(() => {
  jest.clearAllMocks()
  mockVerifyOtp.mockResolvedValue({ data: { user: { user_metadata: { role: 'owner' } } }, error: null })
  mockExchangeCodeForSession.mockResolvedValue({ data: { user: { user_metadata: { role: 'owner' } } }, error: null })
})

it.each([{ role: 'owner', path: '/dashboard' }, { role: 'merchant', path: '/merchant/onboarding' }])('AC-01-05: a signup token opens the $role space after verification', async ({ role, path }) => {
  mockVerifyOtp.mockResolvedValue({ data: { user: { user_metadata: { role } } }, error: null })
  const res = await confirm({ token: 'valid-signup-token' })
  expect(res.status).toBe(200)
  expect(await res.json()).toEqual({ redirect_to: path })
  expect(mockVerifyOtp).toHaveBeenCalledWith({ token_hash: 'valid-signup-token', type: 'signup' })
})

it('AC-01-05: a standard signup code is exchanged using the browser verifier', async () => {
  const res = await confirm({ code: 'valid-pkce-code' })
  expect(res.status).toBe(200)
  expect(mockExchangeCodeForSession).toHaveBeenCalledWith('valid-pkce-code')
  expect(mockVerifyOtp).not.toHaveBeenCalled()
})

it.each(['admin', 'tourist', 'unknown'])('AC-01-05: the public confirmation route cannot grant a %s space', async role => {
  mockVerifyOtp.mockResolvedValue({ data: { user: { user_metadata: { role } } }, error: null })
  expect((await confirm({ token: 'token' })).status).toBe(403)
})

it('AC-01-05: invalid or expired links cannot grant a redirect', async () => {
  mockVerifyOtp.mockResolvedValue({ data: { user: null }, error: { message: 'private verification details' } })
  const res = await confirm({ token: 'expired' })
  expect(res.status).toBe(400)
  expect(JSON.stringify(await res.json())).not.toContain('private verification')
})

it.each([{}, { code: 'code', token: 'token' }])('AC-01-05: missing or ambiguous credentials are rejected before verification', async body => {
  expect((await confirm(body)).status).toBe(400)
  expect(mockVerifyOtp).not.toHaveBeenCalled()
  expect(mockExchangeCodeForSession).not.toHaveBeenCalled()
})
