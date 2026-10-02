import { NextRequest } from 'next/server'

const mockContext = jest.fn()
const mockFindFirst = jest.fn()
const mockCreate = jest.fn()
const mockSend = jest.fn()

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: () => mockContext(),
}))
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodgingStayEvent: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}))
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: (...args: unknown[]) => mockSend(...args) } })),
}))

import { POST } from '@/app/api/guide/stay-events/route'

const request = (body: unknown) => new NextRequest('http://localhost/api/guide/stay-events', {
  method: 'POST', body: JSON.stringify(body),
})
const originalKey = process.env.RESEND_API_KEY
let errorLog: jest.SpyInstance

beforeEach(() => {
  jest.clearAllMocks()
  process.env.RESEND_API_KEY = 're_test_fake'
  mockContext.mockResolvedValue({
    lodgingId: 'lodging-1', lodgingName: 'Le 305', citySlug: 'saint-gervais-les-bains',
    cityName: 'Saint-Gervais-les-Bains', ownerName: null,
  })
  mockFindFirst.mockResolvedValue(null)
  mockCreate.mockResolvedValue({ id: 'event-1' })
  mockSend.mockResolvedValue({ data: { id: 'email-1' }, error: null })
  errorLog = jest.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  errorLog.mockRestore()
  if (originalKey === undefined) delete process.env.RESEND_API_KEY
  else process.env.RESEND_API_KEY = originalKey
})

describe('054 POST /api/guide/stay-events', () => {
  it('AC-03-01: records an anonymous arrival for the session lodging and notifies MyStay', async () => {
    const response = await POST(request({ type: 'arrived', lodging_id: 'other-lodging' }))

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ status: 'recorded' })
    expect(mockCreate).toHaveBeenCalledWith({
      data: { lodging_id: 'lodging-1', type: 'arrived' },
      select: { id: true },
    })
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      from: 'MyStay <bonjour@mystay.city>', to: 'bonjour@mystay.city', subject: 'Arrivée voyageur — Le 305',
    }), { idempotencyKey: 'stay-event-event-1' })
  })

  it('AC-03-02: records a departure with its own subject', async () => {
    const response = await POST(request({ type: 'departed' }))

    expect(response.status).toBe(201)
    expect(mockSend.mock.calls[0][0].subject).toBe('Départ voyageur — Le 305')
  })

  it('AC-03-03: deduplicates the same signal within 10 minutes', async () => {
    mockFindFirst.mockResolvedValue({ id: 'event-0' })

    const response = await POST(request({ type: 'arrived' }))

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ status: 'recorded' })
    const where = mockFindFirst.mock.calls[0][0].where
    expect(where).toMatchObject({ lodging_id: 'lodging-1', type: 'arrived', deleted_at: null })
    const since = where.created_at.gte as Date
    expect(Date.now() - since.getTime()).toBeGreaterThanOrEqual(10 * 60 * 1000 - 1000)
    expect(Date.now() - since.getTime()).toBeLessThanOrEqual(10 * 60 * 1000 + 1000)
    expect(mockCreate).not.toHaveBeenCalled()
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('AC-03-04: rejects calls without a lodging session', async () => {
    mockContext.mockResolvedValue(null)

    const response = await POST(request({ type: 'arrived' }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: { code: 'UNAUTHORIZED', message: expect.any(String), details: {} },
    })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('rejects an invalid type with VALIDATION_ERROR', async () => {
    const response = await POST(request({ type: 'checkin' }))

    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe('VALIDATION_ERROR')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('AC-03-05: logs an email failure without blocking the response', async () => {
    mockSend.mockRejectedValue(new Error('down'))

    const response = await POST(request({ type: 'arrived' }))

    expect(response.status).toBe(201)
    expect(errorLog).toHaveBeenCalled()
  })
})
