import { NextRequest } from 'next/server'

const mockFindCity = jest.fn()
const mockFindLodging = jest.fn()
const mockCreateInteractionEvent = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    city: {
      findFirst: (...args: unknown[]) => mockFindCity(...args),
    },
    lodging: {
      findFirst: (...args: unknown[]) => mockFindLodging(...args),
    },
    analyticsInteractionEvent: {
      create: (...args: unknown[]) => mockCreateInteractionEvent(...args),
    },
  },
}))

import { POST } from '@/app/api/public/analytics/events/route'

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/public/analytics/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const EVENT_ID = '33333333-3333-4333-8333-333333333333'
const CITY_ID = '11111111-1111-4111-8111-111111111111'
const LODGING_ID = '22222222-2222-4222-8222-222222222222'

describe('030 admin analytics public events API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindCity.mockResolvedValue({ id: CITY_ID })
    mockFindLodging.mockResolvedValue({ id: LODGING_ID, deleted_at: null })
    mockCreateInteractionEvent.mockResolvedValue({ id: EVENT_ID })
  })

  it('AC-04-04: records a consented public interaction event', async () => {
    const response = await POST(
      makeRequest({
        event_type: 'lodging_external_booking_click',
        consent_state: 'accepted',
        page_path: '/guide/annecy/logements/chalet-hygge',
        city_slug: 'annecy',
        lodging_id: LODGING_ID,
      }),
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ id: EVENT_ID, status: 'recorded' })
    expect(mockCreateInteractionEvent).toHaveBeenCalledWith({
      data: {
        event_type: 'lodging_external_booking_click',
        consent_state: 'accepted',
        page_path: '/guide/annecy/logements/chalet-hygge',
        city_id: CITY_ID,
        lodging_id: LODGING_ID,
      },
      select: { id: true },
    })
  })

  it('AC-04-05: rejects invalid consent state', async () => {
    const response = await POST(
      makeRequest({
        event_type: 'owner_email_click',
        consent_state: 'refused',
        page_path: '/contact',
      }),
    )

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(mockCreateInteractionEvent).not.toHaveBeenCalled()
  })

  it('BR-11: keeps the event global when city slug cannot be resolved', async () => {
    mockFindCity.mockResolvedValue(null)

    const response = await POST(
      makeRequest({
        event_type: 'mystay_email_click',
        consent_state: 'accepted',
        page_path: '/contact',
        city_slug: 'unknown-city',
      }),
    )

    expect(response.status).toBe(201)
    expect(mockCreateInteractionEvent).toHaveBeenCalledWith({
      data: {
        event_type: 'mystay_email_click',
        consent_state: 'accepted',
        page_path: '/contact',
        city_id: null,
        lodging_id: null,
      },
      select: { id: true },
    })
  })
})
