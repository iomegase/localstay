import { NextRequest } from 'next/server'

const mockGetSessionOwner = jest.fn()
const mockGetOwnerSubscriptionDetail = jest.fn()

jest.mock('@/features/dashboard-owner/lib/get-session-owner', () => ({
  getSessionOwner: function() {
    return mockGetSessionOwner.apply(this, arguments as never)
  },
}))

jest.mock('@/features/subscription-owner/queries/subscription', () => ({
  getOwnerSubscriptionDetail: function() {
    return mockGetOwnerSubscriptionDetail.apply(this, arguments as never)
  },
}))

import { GET as subscriptionGET } from '@/app/api/dashboard/subscription/route'

describe('GET /api/dashboard/subscription', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionOwner.mockResolvedValue({
      owner: { id: 'owner-1', role: 'owner' },
      error: null,
    })
    mockGetOwnerSubscriptionDetail.mockResolvedValue({
      plan: 'trial',
      status: 'trial',
      trial_ends_at: '2027-05-24T00:00:00.000Z',
      days_remaining: 365,
      features: ['Guide public personnalisé'],
    })
  })

  it('AC-01-01: returns the owner subscription detail contract', async () => {
    const res = await subscriptionGET(new NextRequest('http://localhost/api/dashboard/subscription'))

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      plan: 'trial',
      status: 'trial',
      trial_ends_at: '2027-05-24T00:00:00.000Z',
      days_remaining: 365,
      features: ['Guide public personnalisé'],
    })
    expect(mockGetOwnerSubscriptionDetail).toHaveBeenCalledWith('owner-1')
  })

  it('returns the owner auth error unchanged when the session is missing', async () => {
    const error = Response.json({ error: { code: 'UNAUTHORIZED', message: 'Non authentifié' } }, { status: 401 })
    mockGetSessionOwner.mockResolvedValue({ owner: null, error })

    const res = await subscriptionGET(new NextRequest('http://localhost/api/dashboard/subscription'))

    expect(res.status).toBe(401)
    expect(mockGetOwnerSubscriptionDetail).not.toHaveBeenCalled()
  })
})
