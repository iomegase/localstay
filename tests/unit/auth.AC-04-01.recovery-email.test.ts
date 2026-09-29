const mockGenerateLink = jest.fn()
const mockSend = jest.fn()
jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseServer: () => ({ auth: { admin: { generateLink: mockGenerateLink } } }),
}))
jest.mock('resend', () => ({ Resend: jest.fn(() => ({ emails: { send: mockSend } })) }))

import { sendRecoveryEmailViaResend } from '@/features/auth/lib/password-recovery-email'

const originalApiKey = process.env.RESEND_API_KEY
const redirectTo = 'https://www.mystay.city/auth/reset-password'
beforeEach(() => {
  jest.clearAllMocks()
  process.env.RESEND_API_KEY = 'test-resend-key'
  jest.spyOn(console, 'info').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
  mockGenerateLink.mockResolvedValue({ data: { properties: { hashed_token: 'test-token', verification_type: 'recovery' } }, error: null })
  mockSend.mockResolvedValue({ data: { id: 'test-email-id' }, error: null })
})
afterEach(() => {
  if (originalApiKey === undefined) delete process.env.RESEND_API_KEY
  else process.env.RESEND_API_KEY = originalApiKey
  jest.restoreAllMocks()
})

it('AC-04-01: sends a Supabase recovery link compatible with the reset page without logging secrets', async () => {
  await expect(sendRecoveryEmailViaResend('owner@example.com', redirectTo)).resolves.toBe('sent')
  expect(mockGenerateLink).toHaveBeenCalledWith({ type: 'recovery', email: 'owner@example.com', options: { redirectTo } })
  expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
    from: 'MyStay <bonjour@mystay.city>', to: 'owner@example.com',
    text: expect.stringContaining(`${redirectTo}?token_hash=test-token`),
  }))
  const logs = JSON.stringify([(console.info as jest.Mock).mock.calls, (console.error as jest.Mock).mock.calls])
  expect(logs).not.toContain('owner@example.com')
  expect(logs).not.toContain('test-token')
  expect(logs).not.toContain('test-resend-key')
  expect(logs).toContain('test-email-id')
})

it('AC-04-01: an unknown account remains neutral without sending or creating a user', async () => {
  mockGenerateLink.mockResolvedValue({ data: null, error: { code: 'user_not_found', status: 404 } })
  await expect(sendRecoveryEmailViaResend('unknown@example.com', redirectTo)).resolves.toBe('unknown')
  expect(mockSend).not.toHaveBeenCalled()
})

it('AC-04-01: missing Resend configuration does not generate a token', async () => {
  delete process.env.RESEND_API_KEY
  await expect(sendRecoveryEmailViaResend('owner@example.com', redirectTo)).resolves.toBe('unavailable')
  expect(mockGenerateLink).not.toHaveBeenCalled()
})

it.each([
  { data: { id: 'ignored' }, error: { statusCode: 500, message: 'private provider details' }, expected: 'unavailable' },
  { data: null, error: { statusCode: 429 }, expected: 'limited' },
  { data: {}, error: null, expected: 'unavailable' },
])('AC-04-01: email rejection or missing acceptance cannot announce success', async ({ data, error, expected }) => {
  mockSend.mockResolvedValue({ data, error })
  await expect(sendRecoveryEmailViaResend('owner@example.com', redirectTo)).resolves.toBe(expected)
  expect(JSON.stringify((console.error as jest.Mock).mock.calls)).not.toContain('private provider details')
})

it('AC-04-01: a generation failure cannot send a broken link', async () => {
  mockGenerateLink.mockResolvedValue({ data: null, error: { status: 401 } })
  await expect(sendRecoveryEmailViaResend('owner@example.com', redirectTo)).resolves.toBe('unavailable')
  expect(mockSend).not.toHaveBeenCalled()
})
