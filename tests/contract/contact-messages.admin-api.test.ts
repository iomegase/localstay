import { NextRequest } from 'next/server'

const mockGetSessionAdmin = jest.fn()
const mockFindFirstContactMessage = jest.fn()
const mockUpdateContactMessage = jest.fn()
const mockSendContactReplyEmail = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionAdmin: (...args: unknown[]) => mockGetSessionAdmin(...args),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    contactMessage: {
      findFirst: (...args: unknown[]) => mockFindFirstContactMessage(...args),
      update: (...args: unknown[]) => mockUpdateContactMessage(...args),
    },
  },
}))

jest.mock('@/shared/lib/resend', () => ({
  sendContactReplyEmail: (...args: unknown[]) => mockSendContactReplyEmail(...args),
}))

import { DELETE } from '@/app/api/admin/contact-messages/[id]/route'
import { POST as replyPOST } from '@/app/api/admin/contact-messages/[id]/reply/route'

const MESSAGE_ID = '33333333-3333-4333-8333-333333333333'
const ADMIN_ID = '44444444-4444-4444-8444-444444444444'

function makeRequest(url: string, body?: Record<string, unknown>): NextRequest {
  return new NextRequest(url, {
    method: body ? 'POST' : 'DELETE',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

function params(id = MESSAGE_ID): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) }
}

describe('024 contact messages admin API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionAdmin.mockResolvedValue({ user: { id: ADMIN_ID, role: 'admin' }, error: null })
    mockFindFirstContactMessage.mockResolvedValue({
      id: MESSAGE_ID,
      sender_email: 'marie@example.test',
      sender_name: 'Marie Dupont',
      subject: 'Question arrivée',
      message: 'Bonjour, pouvons-nous arriver un peu plus tôt demain ?',
      deleted_at: null,
    })
    mockUpdateContactMessage.mockResolvedValue({ id: MESSAGE_ID })
    mockSendContactReplyEmail.mockResolvedValue(false)
  })

  it('AC-02-03/BR-05: archives a message without physical deletion', async () => {
    const response = await DELETE(
      makeRequest(`http://localhost:3000/api/admin/contact-messages/${MESSAGE_ID}`),
      params(),
    )

    expect(response.status).toBe(200)
    expect(mockFindFirstContactMessage).toHaveBeenCalledWith({
      where: { id: MESSAGE_ID, deleted_at: null },
      select: { id: true },
    })
    expect(mockUpdateContactMessage).toHaveBeenCalledWith({
      where: { id: MESSAGE_ID },
      data: expect.objectContaining({
        status: 'archived',
        archived_at: expect.any(Date),
      }),
      select: { id: true },
    })
  })

  it('AC-03-01/AC-03-03: saves a reply and reports when no email was sent', async () => {
    const response = await replyPOST(
      makeRequest(`http://localhost:3000/api/admin/contact-messages/${MESSAGE_ID}/reply`, {
        reply_body: 'Bonjour Marie, vous pouvez arriver à partir de 14h.',
      }),
      params(),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      message: 'Réponse sauvegardée',
      email_sent: false,
    })
    expect(mockUpdateContactMessage).toHaveBeenCalledWith({
      where: { id: MESSAGE_ID },
      data: expect.objectContaining({
        reply_body: 'Bonjour Marie, vous pouvez arriver à partir de 14h.',
        replied_at: expect.any(Date),
        replied_by_user_id: ADMIN_ID,
        status: 'replied',
      }),
      select: { id: true },
    })
    expect(mockSendContactReplyEmail).toHaveBeenCalledWith({
      to: 'marie@example.test',
      senderName: 'Marie Dupont',
      subject: 'Question arrivée',
      originalMessage: 'Bonjour, pouvons-nous arriver un peu plus tôt demain ?',
      replyBody: 'Bonjour Marie, vous pouvez arriver à partir de 14h.',
    })
  })

  it('BR-07: preserves admin auth errors', async () => {
    const error = Response.json(
      { error: { code: 'FORBIDDEN', message: 'Accès réservé aux administrateurs', details: {} } },
      { status: 403 },
    )
    mockGetSessionAdmin.mockResolvedValue({ user: null, error })

    const response = await DELETE(
      makeRequest(`http://localhost:3000/api/admin/contact-messages/${MESSAGE_ID}`),
      params(),
    )

    expect(response.status).toBe(403)
    expect(mockFindFirstContactMessage).not.toHaveBeenCalled()
  })

  it('returns 404 when the message does not exist', async () => {
    mockFindFirstContactMessage.mockResolvedValue(null)

    const response = await DELETE(
      makeRequest(`http://localhost:3000/api/admin/contact-messages/${MESSAGE_ID}`),
      params(),
    )

    expect(response.status).toBe(404)
    expect(mockUpdateContactMessage).not.toHaveBeenCalled()
  })
})
