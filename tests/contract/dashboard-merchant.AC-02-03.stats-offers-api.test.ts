import { NextRequest } from 'next/server'

const mockGetUser = jest.fn()
const mockFindUser = jest.fn()
const mockFindFirstProfile = jest.fn()
const mockFindManyAnalytics = jest.fn()
const mockFindManyOffers = jest.fn()
const mockCountOffers = jest.fn()
const mockCreateOffer = jest.fn()
const mockFindFirstOffer = jest.fn()
const mockUpdateOffer = jest.fn()

jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseRouteClient: jest.fn(async function() {
    return {
      auth: { getUser: function() { return mockGetUser.apply(this, arguments as any) } },
    }
  }),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    user: { findFirst: function() { return mockFindUser.apply(this, arguments as any) } },
    merchantProfile: { findFirst: function() { return mockFindFirstProfile.apply(this, arguments as any) } },
    analytics: { findMany: function() { return mockFindManyAnalytics.apply(this, arguments as any) } },
    merchantOffer: {
      findMany: function() { return mockFindManyOffers.apply(this, arguments as any) },
      count: function() { return mockCountOffers.apply(this, arguments as any) },
      create: function() { return mockCreateOffer.apply(this, arguments as any) },
      findFirst: function() { return mockFindFirstOffer.apply(this, arguments as any) },
      update: function() { return mockUpdateOffer.apply(this, arguments as any) },
    },
  },
}))

import { GET as statsGET } from '@/app/api/merchant/stats/route'
import { GET as offersGET, POST as offersPOST } from '@/app/api/merchant/offers/route'
import { DELETE as offerDELETE } from '@/app/api/merchant/offers/[id]/route'

const merchant = { id: 'merchant-1', supabase_id: 'supa-merchant', role: 'merchant', is_active: true, deleted_at: null }
const activeProfile = { id: 'profile-1', merchant_id: 'merchant-1', poi_id: 'poi-1', status: 'active', approved_claim_id: 'claim-1' }

function makeRequest(url: string, method = 'GET', body?: object): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('015 merchant stats and offers API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(new Date('2026-05-24T12:00:00Z'))
    mockGetUser.mockResolvedValue({ data: { user: { id: 'supa-merchant' } } })
    mockFindUser.mockResolvedValue(merchant)
    mockFindFirstProfile.mockResolvedValue(activeProfile)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('AC-02-01/02/03: returns 30-day stats isolated to the merchant POI', async () => {
    mockFindManyAnalytics.mockResolvedValue([
      { created_at: new Date('2026-05-23T10:00:00Z'), event_type: 'poi_click', poi_id: 'poi-1' },
      { created_at: new Date('2026-05-23T11:00:00Z'), event_type: 'phone_click', poi_id: 'poi-1' },
      { created_at: new Date('2026-05-22T11:00:00Z'), event_type: 'directions_click', poi_id: 'poi-1' },
      { created_at: new Date('2026-05-21T11:00:00Z'), event_type: 'website_click', poi_id: 'poi-1' },
    ])

    const res = await statsGET(makeRequest('http://localhost/api/merchant/stats'))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.totals).toEqual({
      profile_views: 1,
      phone_clicks: 1,
      directions_clicks: 1,
      website_clicks: 1,
    })
    expect(json.data.views_series).toHaveLength(30)
    expect(mockFindManyAnalytics).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        poi_id: 'poi-1',
        event_type: { in: ['poi_click', 'phone_click', 'directions_click', 'website_click'] },
      }),
    }))
  })

  it('AC-03-01/02: lists non-deleted offers and marks expired offers as expired', async () => {
    mockFindManyOffers.mockResolvedValue([
      { id: 'offer-1', title: 'Apéro', description: 'Verre offert', ends_at: new Date('2026-05-30T12:00:00Z'), is_active: true },
      { id: 'offer-2', title: 'Ancienne offre', description: 'Terminé', ends_at: new Date('2026-05-01T12:00:00Z'), is_active: true },
    ])

    const res = await offersGET(makeRequest('http://localhost/api/merchant/offers'))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toEqual([
      expect.objectContaining({ id: 'offer-1', status: 'active' }),
      expect.objectContaining({ id: 'offer-2', status: 'expired' }),
    ])
    expect(mockFindManyOffers).toHaveBeenCalledWith(expect.objectContaining({
      where: { poi_id: 'poi-1', deleted_at: null },
    }))
  })

  it('AC-03-01/03: creates an offer unless 3 active non-expired offers already exist', async () => {
    mockCountOffers.mockResolvedValueOnce(3)

    const blocked = await offersPOST(makeRequest('http://localhost/api/merchant/offers', 'POST', {
      title: 'Offre 4',
      description: 'Pas possible',
      ends_at: '2026-06-01T12:00:00.000Z',
    }))

    expect(blocked.status).toBe(409)
    await expect(blocked.json()).resolves.toMatchObject({ error: { code: 'OFFER_LIMIT_REACHED' } })
    expect(mockCreateOffer).not.toHaveBeenCalled()

    mockCountOffers.mockResolvedValueOnce(2)
    mockCreateOffer.mockResolvedValue({
      id: 'offer-new',
      title: 'Dessert offert',
      description: 'Sur présentation de MyStay',
      ends_at: new Date('2026-06-01T12:00:00Z'),
      is_active: true,
    })

    const created = await offersPOST(makeRequest('http://localhost/api/merchant/offers', 'POST', {
      title: 'Dessert offert',
      description: 'Sur présentation de MyStay',
      ends_at: '2026-06-01T12:00:00.000Z',
    }))

    expect(created.status).toBe(201)
    await expect(created.json()).resolves.toMatchObject({ data: { id: 'offer-new', status: 'active' } })
    expect(mockCreateOffer).toHaveBeenCalledWith({
      data: {
        poi_id: 'poi-1',
        title: 'Dessert offert',
        description: 'Sur présentation de MyStay',
        ends_at: new Date('2026-06-01T12:00:00.000Z'),
      },
    })
  })

  it('AC-03-04: soft deletes only an offer attached to the merchant POI', async () => {
    mockFindFirstOffer.mockResolvedValue({ id: 'offer-1', poi_id: 'poi-1', deleted_at: null })
    mockUpdateOffer.mockResolvedValue({ id: 'offer-1', deleted_at: new Date('2026-05-24T12:00:00Z') })

    const res = await offerDELETE(makeRequest('http://localhost/api/merchant/offers/offer-1', 'DELETE'), {
      params: Promise.resolve({ id: 'offer-1' }),
    })

    expect(res.status).toBe(204)
    expect(mockUpdateOffer).toHaveBeenCalledWith({
      where: { id: 'offer-1' },
      data: { deleted_at: new Date('2026-05-24T12:00:00.000Z'), is_active: false },
    })
  })
})
