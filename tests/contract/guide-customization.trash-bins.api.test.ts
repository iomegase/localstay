import { NextRequest } from 'next/server'

const mockGetSessionOwner = jest.fn()
const mockGetCustomization = jest.fn()
const mockSaveCustomization = jest.fn()

jest.mock('@/features/dashboard-owner/lib/get-session-owner', () => ({
  getSessionOwner: () => mockGetSessionOwner(),
}))

jest.mock('@/features/guide-customization/queries/customization', () => ({
  getLodgingCustomization: (...args: unknown[]) => mockGetCustomization(...args),
  saveLodgingCustomization: (...args: unknown[]) => mockSaveCustomization(...args),
}))

import { PUT } from '@/app/api/dashboard/lodgings/[id]/customization/route'

const owner = { id: 'owner-1', role: 'owner' }

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/dashboard/lodgings/lodging-1/customization', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('PUT customization — trash_bins', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionOwner.mockResolvedValue({ owner, error: null })
    mockSaveCustomization.mockResolvedValue({
      lodging_id: 'lodging-1', welcome_message: null, category_order: [],
      featured_pois: [], ignored_category_slugs: [],
    })
  })

  it('forwards valid trash_bins to the save query', async () => {
    const res = await PUT(
      makeRequest({
        category_order: [],
        featured_pois: [],
        trash_bins: [{ type: 'jaune' }],
      }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(200)
    expect(mockSaveCustomization).toHaveBeenCalledWith(
      'owner-1',
      'lodging-1',
      expect.objectContaining({
        trash_bins: [{ type: 'jaune' }],
      }),
    )
  })

  it('rejects a trash bin with a type outside the preset', async () => {
    const res = await PUT(
      makeRequest({
        category_order: [],
        featured_pois: [],
        trash_bins: [{ type: 'rose', description: 'Type inconnu' }],
      }),
      { params: Promise.resolve({ id: 'lodging-1' }) },
    )

    expect(res.status).toBe(400)
    expect(mockSaveCustomization).not.toHaveBeenCalled()
  })
})
