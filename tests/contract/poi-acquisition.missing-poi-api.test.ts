import { NextRequest } from 'next/server'

const mockGetSessionMerchant = jest.fn()
const mockCreateMissingPoiRequest = jest.fn()

jest.mock('@/features/merchant/lib/session', () => ({
  getSessionMerchant: () => mockGetSessionMerchant(),
}))

jest.mock('@/features/poi-acquisition/queries/missing-poi', () => ({
  createMissingPoiRequest: (...args: unknown[]) => mockCreateMissingPoiRequest(...args),
}))

import { POST } from '@/app/api/merchant/onboarding/missing-poi/route'

function request(body: object) {
  return new NextRequest('http://localhost/api/merchant/onboarding/missing-poi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('018 merchant missing POI API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionMerchant.mockResolvedValue({ user: { id: 'merchant-1', role: 'merchant' }, error: null })
  })

  it('AC-03-02/03-03/03-04: creates a pending MissingPoiRequest with server-side matching/geocoding', async () => {
    mockCreateMissingPoiRequest.mockResolvedValue({
      id: 'missing-1',
      status: 'pending',
      google_place_id: 'place-1',
      geocode_status: 'success',
    })

    const res = await POST(request({
      name: 'Brasserie absente',
      address: '1 Rue Test',
      phone: '+33 4 00 00 00 00',
      website: 'https://example.com',
      city_id: 'city-1',
      category_id: 'cat-1',
    }))

    expect(res.status).toBe(201)
    expect(mockCreateMissingPoiRequest).toHaveBeenCalledWith('merchant-1', expect.objectContaining({
      name: 'Brasserie absente',
      city_id: 'city-1',
    }))
  })
})
