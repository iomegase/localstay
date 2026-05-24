import { NextRequest } from 'next/server'

const mockGetSessionOwner = jest.fn()

jest.mock('@/features/dashboard-owner/lib/get-session-owner', () => ({
  getSessionOwner: function() {
    return mockGetSessionOwner.apply(this, arguments as never)
  },
}))

import { GET as plansGET } from '@/app/api/dashboard/subscription/plans/route'

describe('GET /api/dashboard/subscription/plans', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionOwner.mockResolvedValue({
      owner: { id: 'owner-1', role: 'owner' },
      error: null,
    })
  })

  it('AC-02-01: returns the static indicative owner plans', async () => {
    const res = await plansGET(new NextRequest('http://localhost/api/dashboard/subscription/plans'))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.plans).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: 'basic',
          name: 'Basic',
          price_label: '9-19€/logement',
          price_disclaimer: 'indicative_non_contractual',
        }),
      ]),
    )
    expect(json.plans).toHaveLength(4)
  })

  it('returns 403 when the authenticated user is not an owner', async () => {
    const error = Response.json({ error: { code: 'FORBIDDEN', message: 'Accès réservé aux hébergeurs' } }, { status: 403 })
    mockGetSessionOwner.mockResolvedValue({ owner: null, error })

    const res = await plansGET(new NextRequest('http://localhost/api/dashboard/subscription/plans'))

    expect(res.status).toBe(403)
  })
})
