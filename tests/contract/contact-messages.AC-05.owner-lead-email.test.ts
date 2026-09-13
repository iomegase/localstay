import { NextRequest } from 'next/server'

const mockCreate = jest.fn()
const mockSend = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({
  prisma: { contactMessage: { create: (...args: unknown[]) => mockCreate(...args) } },
}))
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: (...args: unknown[]) => mockSend(...args) } })),
}))

import { POST } from '@/app/api/public/contact-messages/route'
import { sendContactReplyEmail } from '@/shared/lib/resend'

const body = {
  source: 'owner_lead', destination: 'concierge', lodging_id: null,
  sender_name: 'Marie Dupont', sender_email: 'marie@example.test', sender_phone: '0600000000',
  subject: 'Demande propriétaire — Chalet — Chamonix', message: 'Je souhaite confier mon chalet.',
}
const originalKey = process.env.RESEND_API_KEY
const request = (overrides: Record<string, unknown> = {}) => new NextRequest('http://localhost/api/public/contact-messages', {
  method: 'POST', body: JSON.stringify({ ...body, ...overrides }),
})
let errorLog: jest.SpyInstance

beforeEach(() => {
  jest.clearAllMocks()
  process.env.RESEND_API_KEY = 're_test_fake'
  mockCreate.mockResolvedValue({ id: 'message-123' })
  mockSend.mockResolvedValue({ data: { id: 'email-123' }, error: null })
  errorLog = jest.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  errorLog.mockRestore()
  if (originalKey === undefined) delete process.env.RESEND_API_KEY
  else process.env.RESEND_API_KEY = originalKey
})

it('AC-05-01: stores first, then notifies only MyStay with reply-to, details and idempotency', async () => {
  mockSend.mockImplementation(async () => {
    expect(mockCreate).toHaveBeenCalledTimes(1)
    return { data: { id: 'email-123' }, error: null }
  })
  const response = await POST(request())
  expect(response.status).toBe(201)
  await expect(response.json()).resolves.toEqual({ id: 'message-123', status: 'received' })
  expect(mockCreate).toHaveBeenCalledWith({ data: expect.not.objectContaining({ source: 'owner_lead' }), select: { id: true } })
  expect(mockSend).toHaveBeenCalledTimes(1)
  expect(mockSend).toHaveBeenCalledWith({
    from: 'MyStay <bonjour@mystay.city>', to: 'bonjour@mystay.city', replyTo: body.sender_email,
    subject: body.subject, text: expect.stringContaining(body.message),
  }, { idempotencyKey: 'owner-lead-message-123' })
  const text = mockSend.mock.calls[0][0].text as string
  for (const expected of [body.sender_name, body.sender_email, body.sender_phone, 'https://www.mystay.city/admin']) expect(text).toContain(expected)
})

it.each(['missing-key', 'rejected', 'network', 'missing-id'])('AC-05-02: preserves the saved lead on %s', async (failure) => {
  if (failure === 'missing-key') delete process.env.RESEND_API_KEY
  if (failure === 'rejected') mockSend.mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'sensitive provider response' } })
  if (failure === 'network') mockSend.mockRejectedValue(new Error('sensitive network details'))
  if (failure === 'missing-id') mockSend.mockResolvedValue({ data: null, error: null })
  const response = await POST(request())
  expect(response.status).toBe(201)
  expect(mockCreate).toHaveBeenCalledTimes(1)
  expect(errorLog).toHaveBeenCalledWith('OWNER_LEAD_NOTIFICATION_FAILED', { messageId: 'message-123' })
  const logs = JSON.stringify(errorLog.mock.calls)
  for (const secret of ['sensitive', body.sender_email, body.message, 're_test_fake']) expect(logs).not.toContain(secret)
  if (failure === 'missing-key') expect(mockSend).not.toHaveBeenCalled()
})

it.each([
  [{ sender_email: 'invalid' }, 400],
  [{ website: 'spam' }, 201],
  [{ source: 'invalid' }, 400],
  [{ destination: 'owner' }, 400],
  [{ lodging_id: '11111111-1111-4111-8111-111111111111' }, 400],
])('AC-05-03: rejects invalid or bot lead %j without storage or mail', async (override, status) => {
  const response = await POST(request(override as Record<string, unknown>))
  expect(response.status).toBe(status)
  expect(mockCreate).not.toHaveBeenCalled()
  expect(mockSend).not.toHaveBeenCalled()
})
it('AC-05-03: other contact forms do not trigger lead notifications', async () => {
  expect((await POST(request({ source: undefined }))).status).toBe(201)
  expect(mockCreate).toHaveBeenCalledTimes(1)
  expect(mockSend).not.toHaveBeenCalled()
})
it('AC-05-03: does not send when storage fails', async () => {
  mockCreate.mockRejectedValue(new Error('database unavailable'))
  await expect(POST(request())).rejects.toThrow('database unavailable')
  expect(mockSend).not.toHaveBeenCalled()
})

it.each(['accepted', 'rejected', 'network', 'missing-key', 'missing-id'])('AC-05-04: admin reply reports %s accurately', async (result) => {
  if (result === 'missing-key') delete process.env.RESEND_API_KEY
  if (result === 'rejected') mockSend.mockResolvedValue({ data: null, error: { name: 'validation_error' } })
  if (result === 'network') mockSend.mockRejectedValue(new Error('offline'))
  if (result === 'missing-id') mockSend.mockResolvedValue({ data: null, error: null })
  const sent = await sendContactReplyEmail({ to: body.sender_email, senderName: body.sender_name, subject: body.subject, originalMessage: body.message, replyBody: '<script>test</script>' })
  expect(sent).toBe(result === 'accepted')
  if (result !== 'missing-key') {
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ from: 'MyStay <bonjour@mystay.city>', to: body.sender_email, html: expect.stringContaining('&lt;script&gt;') }), undefined)
  }
})
