import { NextRequest } from 'next/server'

const mockCreate = jest.fn()
const mockSend = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    contactMessage: { create: (...args: unknown[]) => mockCreate(...args) },
    lodging: { findFirst: jest.fn().mockResolvedValue(null) },
  },
}))
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: (...args: unknown[]) => mockSend(...args) } })),
}))

import { POST } from '@/app/api/public/contact-messages/route'

const body = {
  source: 'help_contact', destination: 'concierge', lodging_id: null,
  sender_name: 'Paul Durand', sender_email: 'paul@exemple.test', sender_phone: null,
  subject: 'Aide & contact — Voyageur',
  message: 'Bonjour, je cherche le lien de mon guide de séjour.',
}
const originalKey = process.env.RESEND_API_KEY
const request = (overrides: Record<string, unknown> = {}) => new NextRequest('http://localhost/api/public/contact-messages', {
  method: 'POST', body: JSON.stringify({ ...body, ...overrides }),
})
let errorLog: jest.SpyInstance

beforeEach(() => {
  jest.clearAllMocks()
  process.env.RESEND_API_KEY = 're_test_fake'
  mockCreate.mockResolvedValue({ id: 'message-789' })
  mockSend.mockResolvedValue({ data: { id: 'email-789' }, error: null })
  errorLog = jest.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  errorLog.mockRestore()
  if (originalKey === undefined) delete process.env.RESEND_API_KEY
  else process.env.RESEND_API_KEY = originalKey
})

describe('053 help contact API', () => {
  it('AC-01-03: stores the message as a concierge message and notifies MyStay', async () => {
    const response = await POST(request())

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ id: 'message-789', status: 'received' })
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ destination: 'concierge', lodging_id: null, subject: body.subject, message: body.message }),
      select: { id: true },
    })
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      from: 'MyStay <bonjour@mystay.city>', to: 'bonjour@mystay.city', replyTo: body.sender_email, subject: body.subject,
    }), { idempotencyKey: 'help-contact-message-789' })
    const text = mockSend.mock.calls[0][0].text as string
    expect(text).toContain('Nouveau message Aide & contact MyStay')
    for (const expected of [body.sender_name, body.sender_email, 'lien de mon guide', 'https://www.mystay.city/admin']) {
      expect(text).toContain(expected)
    }
  })

  it('AC-01-03: keeps the saved message when the notification fails', async () => {
    mockSend.mockRejectedValue(new Error('network down'))

    const response = await POST(request())
    expect(response.status).toBe(201)
    expect(errorLog).toHaveBeenCalledWith('HELP_CONTACT_NOTIFICATION_FAILED', { messageId: 'message-789' })
  })

  it.each([
    ['an owner destination', { destination: 'owner' }],
    ['a lodging', { lodging_id: '3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f' }],
  ])('AC-01-05: rejects a help contact with %s, without storing anything', async (_label, overrides) => {
    const response = await POST(request(overrides))

    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe('VALIDATION_ERROR')
    expect(mockCreate).not.toHaveBeenCalled()
    expect(mockSend).not.toHaveBeenCalled()
  })
})
