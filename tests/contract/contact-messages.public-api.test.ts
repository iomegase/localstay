import { NextRequest } from 'next/server'

const mockFindFirstLodging = jest.fn()
const mockCreateContactMessage = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: {
      findFirst: (...args: unknown[]) => mockFindFirstLodging(...args),
    },
    contactMessage: {
      create: (...args: unknown[]) => mockCreateContactMessage(...args),
    },
  },
}))

import { POST } from '@/app/api/public/contact-messages/route'

const LODGING_ID = '11111111-1111-4111-8111-111111111111'
const OWNER_ID = '22222222-2222-4222-8222-222222222222'
const MESSAGE_ID = '33333333-3333-4333-8333-333333333333'

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/public/contact-messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBody = {
  lodging_id: LODGING_ID,
  destination: 'owner',
  sender_name: 'Marie Dupont',
  sender_email: 'marie@example.test',
  sender_phone: '+33 6 12 34 56 78',
  subject: 'Question arrivée',
  message: 'Bonjour, pouvons-nous arriver un peu plus tôt demain ?',
}

describe('024 contact messages public API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindFirstLodging.mockResolvedValue({
      id: LODGING_ID,
      owner_id: OWNER_ID,
      deleted_at: null,
      owner: { id: OWNER_ID, is_active: true, deleted_at: null },
    })
    mockCreateContactMessage.mockResolvedValue({ id: MESSAGE_ID })
  })

  it('AC-01-02/BR-01: stores owner messages with lodging, owner and central super-admin visibility', async () => {
    const response = await POST(makeRequest(validBody))

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ id: MESSAGE_ID, status: 'received' })
    expect(mockCreateContactMessage).toHaveBeenCalledWith({
      data: expect.objectContaining({
        lodging_id: LODGING_ID,
        owner_id: OWNER_ID,
        destination: 'owner',
        sender_name: 'Marie Dupont',
        sender_email: 'marie@example.test',
        sender_phone: '+33 6 12 34 56 78',
        subject: 'Question arrivée',
        message: 'Bonjour, pouvons-nous arriver un peu plus tôt demain ?',
      }),
      select: { id: true },
    })
  })

  it('AC-01-03: stores concierge messages with the lodging when it is known', async () => {
    const response = await POST(makeRequest({ ...validBody, destination: 'concierge' }))

    expect(response.status).toBe(201)
    expect(mockCreateContactMessage).toHaveBeenCalledWith({
      data: expect.objectContaining({
        lodging_id: LODGING_ID,
        owner_id: null,
        destination: 'concierge',
      }),
      select: { id: true },
    })
  })

  it('AC-01-04: rejects invalid public input with structured Zod details', async () => {
    const response = await POST(makeRequest({ ...validBody, sender_email: 'not-an-email' }))

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(json.error.details).toEqual(expect.objectContaining({ fieldErrors: expect.any(Object) }))
    expect(mockCreateContactMessage).not.toHaveBeenCalled()
  })

  it('BR-03: rejects owner destination without an active owner lodging', async () => {
    mockFindFirstLodging.mockResolvedValue(null)

    const response = await POST(makeRequest(validBody))

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error.code).toBe('INVALID_LODGING')
    expect(mockCreateContactMessage).not.toHaveBeenCalled()
  })
})
