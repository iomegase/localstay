import { NextRequest } from 'next/server'

const mockExpireTrials = jest.fn()

jest.mock('@/features/subscription-owner/queries/subscription', () => ({
  expirePastDueTrials: function() {
    return mockExpireTrials.apply(this, arguments as never)
  },
}))

import { POST } from '@/app/api/internal/check-subscriptions/route'

function makeRequest(token = 'test-secret'): NextRequest {
  return new NextRequest('http://localhost/api/internal/check-subscriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
}

describe('POST /api/internal/check-subscriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.INTERNAL_API_SECRET = 'test-secret'
    mockExpireTrials.mockResolvedValue({ count: 2 })
  })

  it('BR-04: marks expired trial subscriptions as past_due', async () => {
    const res = await POST(makeRequest())

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ data: { updated: 2 } })
    expect(mockExpireTrials).toHaveBeenCalled()
  })

  it('requires the internal API secret', async () => {
    const res = await POST(makeRequest('wrong-token'))

    expect(res.status).toBe(401)
    expect(mockExpireTrials).not.toHaveBeenCalled()
  })
})
