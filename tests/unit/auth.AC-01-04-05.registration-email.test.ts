const mockGenerateLink = jest.fn()
const mockSend = jest.fn()
jest.mock('@/shared/lib/supabase', () => ({ createSupabaseServer: () => ({ auth: { admin: { generateLink: mockGenerateLink } } }) }))
jest.mock('resend', () => ({ Resend: jest.fn(() => ({ emails: { send: mockSend } })) }))
import { registerWithResend } from '@/features/auth/lib/registration-email'
import { sendWelcomeEmail } from '@/shared/lib/resend'
import type { RegisterInput } from '@/features/auth/schemas'

const originalKey = process.env.RESEND_API_KEY
const input: RegisterInput = { email: 'owner@example.com', password: 'test-password', role: 'owner', first_name: 'Jean', last_name: 'Dupont' }
const redirectTo = 'https://www.mystay.city/auth/confirm-registration'
beforeEach(() => {
  jest.clearAllMocks()
  process.env.RESEND_API_KEY = 'test-resend-key'
  jest.spyOn(console, 'info').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
  mockGenerateLink.mockResolvedValue({ data: { properties: { hashed_token: 'test-signup-token', verification_type: 'signup' }, user: { id: 'test-user', email_confirmed_at: null } }, error: null })
  mockSend.mockResolvedValue({ data: { id: 'test-email-id' }, error: null })
})
afterEach(() => {
  if (originalKey === undefined) delete process.env.RESEND_API_KEY
  else process.env.RESEND_API_KEY = originalKey
  jest.restoreAllMocks()
})

it('AC-01-05: creates an unconfirmed signup with its role and sends a compatible link without logging credentials', async () => {
  await expect(registerWithResend(input, redirectTo)).resolves.toMatchObject({ status: 'sent', user: { id: 'test-user' } })
  expect(mockGenerateLink).toHaveBeenCalledWith({ type: 'signup', email: input.email, password: input.password, options: { redirectTo, data: { role: 'owner', first_name: 'Jean', last_name: 'Dupont' } } })
  expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ from: 'MyStay <bonjour@mystay.city>', text: expect.stringContaining(`${redirectTo}?token_hash=test-signup-token`) }))
  const logs = JSON.stringify([(console.info as jest.Mock).mock.calls, (console.error as jest.Mock).mock.calls])
  for (const secret of [input.email, input.password, 'test-signup-token', 'test-resend-key']) expect(logs).not.toContain(secret)
})

it('AC-01-02: a duplicate account cannot be changed by the signup fallback', async () => {
  mockGenerateLink.mockResolvedValue({ data: null, error: { code: 'email_exists', status: 422 } })
  await expect(registerWithResend(input, redirectTo)).resolves.toEqual({ status: 'conflict' })
  expect(mockSend).not.toHaveBeenCalled()
})

it('AC-01-05: an unexpected confirmed account is not accepted as a public signup', async () => {
  mockGenerateLink.mockResolvedValue({ data: { properties: { hashed_token: 'token', verification_type: 'signup' }, user: { id: 'existing', email_confirmed_at: '2026-01-01' } }, error: null })
  await expect(registerWithResend(input, redirectTo)).resolves.toEqual({ status: 'unavailable' })
  expect(mockSend).not.toHaveBeenCalled()
})

it('AC-01-05: absent Resend credentials cannot generate a signup account', async () => {
  delete process.env.RESEND_API_KEY
  await expect(registerWithResend(input, redirectTo)).resolves.toEqual({ status: 'unavailable' })
  expect(mockGenerateLink).not.toHaveBeenCalled()
})

it.each([{ data: {}, error: null }, { data: null, error: { statusCode: 500, message: 'private details' } }])('AC-01-05: a rejected or unacknowledged email cannot announce success', async result => {
  mockSend.mockResolvedValue(result)
  await expect(registerWithResend(input, redirectTo)).resolves.toEqual({ status: 'unavailable' })
  expect(JSON.stringify((console.error as jest.Mock).mock.calls)).not.toContain('private details')
})

it('AC-01-04: welcome email uses the verified mystay.city sender', async () => {
  await sendWelcomeEmail({ to: input.email, firstName: input.first_name })
  expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ from: 'MyStay <bonjour@mystay.city>', subject: 'Bienvenue sur MyStay' }))
})
