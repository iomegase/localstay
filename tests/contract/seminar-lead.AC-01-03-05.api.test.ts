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
  source: 'seminar_lead', destination: 'concierge', lodging_id: null,
  sender_name: 'Claire Martin', sender_email: 'claire@entreprise.test', sender_phone: '0611223344',
  subject: 'Demande séminaire — Acme — Saint-Gervais-les-Bains',
  message: 'Entreprise : Acme\nParticipants : 16 à 26\nDates souhaitées : mars 2027\n\nSéminaire CODIR de deux jours.',
}
const originalKey = process.env.RESEND_API_KEY
const request = (overrides: Record<string, unknown> = {}) => new NextRequest('http://localhost/api/public/contact-messages', {
  method: 'POST', body: JSON.stringify({ ...body, ...overrides }),
})
let errorLog: jest.SpyInstance

beforeEach(() => {
  jest.clearAllMocks()
  process.env.RESEND_API_KEY = 're_test_fake'
  mockCreate.mockResolvedValue({ id: 'message-456' })
  mockSend.mockResolvedValue({ data: { id: 'email-456' }, error: null })
  errorLog = jest.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  errorLog.mockRestore()
  if (originalKey === undefined) delete process.env.RESEND_API_KEY
  else process.env.RESEND_API_KEY = originalKey
})

describe('052 seminar lead API', () => {
  it('AC-01-03: stores the seminar lead as a concierge message and notifies MyStay', async () => {
    const response = await POST(request())

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ id: 'message-456', status: 'received' })
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ destination: 'concierge', lodging_id: null, subject: body.subject, message: body.message }),
      select: { id: true },
    })
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      from: 'MyStay <bonjour@mystay.city>', to: 'bonjour@mystay.city', replyTo: body.sender_email, subject: body.subject,
    }), { idempotencyKey: 'seminar-lead-message-456' })
    const text = mockSend.mock.calls[0][0].text as string
    expect(text).toContain('Nouvelle demande séminaire MyStay')
    // Spec 096 : le téléphone arrive au format international.
    for (const expected of [body.sender_name, body.sender_email, '+33611223344', 'Séminaire CODIR', 'https://www.mystay.city/admin']) {
      expect(text).toContain(expected)
    }
  })

  it('AC-01-03: keeps the saved lead when the notification fails', async () => {
    mockSend.mockRejectedValue(new Error('network down'))

    const response = await POST(request())
    expect(response.status).toBe(201)
    expect(mockCreate).toHaveBeenCalledTimes(1)
    expect(errorLog).toHaveBeenCalledWith('SEMINAR_LEAD_NOTIFICATION_FAILED', { messageId: 'message-456' })
  })

  it.each([
    ['an owner destination', { destination: 'owner' }],
    ['a lodging', { lodging_id: '3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f' }],
  ])('AC-01-05: rejects a seminar lead with %s, without storing anything', async (_label, overrides) => {
    const response = await POST(request(overrides))

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(mockCreate).not.toHaveBeenCalled()
    expect(mockSend).not.toHaveBeenCalled()
  })
})
