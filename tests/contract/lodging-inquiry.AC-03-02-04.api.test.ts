import { NextRequest } from 'next/server'

const mockCreate = jest.fn()
const mockSend = jest.fn()
const mockProfileFindFirst = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    contactMessage: { create: (...args: unknown[]) => mockCreate(...args) },
    lodging: { findFirst: jest.fn().mockResolvedValue(null) },
    lodgingPublicProfile: { findFirst: (...args: unknown[]) => mockProfileFindFirst(...args) },
  },
}))
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: (...args: unknown[]) => mockSend(...args) } })),
}))

import { POST } from '@/app/api/public/contact-messages/route'

const body = {
  source: 'lodging_inquiry', destination: 'concierge', lodging_slug: 'chalet-hygge',
  sender_name: 'Paul Durand', sender_email: 'paul@exemple.test', sender_phone: null,
  subject: 'Demande logement — Chalet Hygge',
  message: 'Bonjour, le chalet est-il disponible la semaine du 14 février ?',
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
  mockProfileFindFirst.mockResolvedValue({ lodging_id: 'lodging-real-id', title: 'Chalet Hygge' })
  errorLog = jest.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  errorLog.mockRestore()
  if (originalKey === undefined) delete process.env.RESEND_API_KEY
  else process.env.RESEND_API_KEY = originalKey
})

describe('028 amendement 2026-10-05 — demande sur un logement public', () => {
  it('AC-03-04: résout le logement côté serveur depuis son slug public et notifie la conciergerie', async () => {
    const response = await POST(request())

    expect(response.status).toBe(201)
    expect(mockProfileFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        slug: 'chalet-hygge',
        publication_status: 'published',
        public_contact_enabled: true,
        deleted_at: null,
      }),
    }))
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        destination: 'concierge', lodging_id: 'lodging-real-id', owner_id: null, subject: body.subject,
      }),
      select: { id: true },
    })
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      to: 'bonjour@mystay.city', replyTo: body.sender_email,
    }), { idempotencyKey: 'lodging-inquiry-message-456' })
    const text = mockSend.mock.calls[0][0].text as string
    expect(text).toContain('Nouvelle demande sur un logement MyStay')
    expect(text).toContain('Logement : Chalet Hygge')
    expect(text).toContain('semaine du 14 février')
  })

  it('AC-03-04: refuse un slug non publié ou sans contact public, sans rien enregistrer', async () => {
    mockProfileFindFirst.mockResolvedValue(null)

    const response = await POST(request({ lodging_slug: 'brouillon' }))

    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe('INVALID_LODGING')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it.each([
    ['un identifiant de logement', { lodging_id: '3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f' }],
    ['la destination propriétaire', { destination: 'owner' }],
    ['un slug absent', { lodging_slug: undefined }],
    ['un slug invalide', { lodging_slug: '../admin' }],
  ])('AC-03-02: refuse une demande avec %s', async (_label, overrides) => {
    const response = await POST(request(overrides))

    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe('VALIDATION_ERROR')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('AC-03-04: refuse un slug de logement pour les autres sources', async () => {
    const response = await POST(request({ source: 'help_contact', lodging_slug: 'chalet-hygge' }))

    expect(response.status).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })
})
