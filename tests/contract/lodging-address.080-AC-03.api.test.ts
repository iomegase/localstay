import { NextRequest, NextResponse } from 'next/server'

const mockGetSessionOwner = jest.fn()
const mockSaveAddress = jest.fn()
jest.mock('@/features/dashboard-owner/lib/get-session-owner', () => ({ getSessionOwner: () => mockGetSessionOwner() }))
jest.mock('@/features/guide-customization/queries/customization', () => ({ saveLodgingAddress: (...args: unknown[]) => mockSaveAddress(...args) }))

import { PUT } from '@/app/api/dashboard/lodgings/[id]/address/route'
import { GuideCustomizationError } from '@/features/guide-customization/types'

const put = (body: unknown) => new NextRequest('http://localhost/api/dashboard/lodgings/lodging-1/address', {
  method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
})
const params = { params: Promise.resolve({ id: 'lodging-1' }) }
const address = { address_number: '12', address_street: 'rue des Alpages', address_postal_code: '74170', address_city: 'Saint-Gervais-les-Bains' }

describe('080 AC-03-02 — PUT /api/dashboard/lodgings/{id}/address', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSessionOwner.mockResolvedValue({ owner: { id: 'owner-1' }, error: null })
  })

  it('saves the four parts for the session owner', async () => {
    mockSaveAddress.mockResolvedValue({ ...address, lodging_address: '12 rue des Alpages, 74170 Saint-Gervais-les-Bains' })
    const response = await PUT(put(address), params)
    expect(response.status).toBe(200)
    expect(mockSaveAddress).toHaveBeenCalledWith('owner-1', 'lodging-1', address)
    expect(await response.json()).toMatchObject({ lodging_address: '12 rue des Alpages, 74170 Saint-Gervais-les-Bains' })
  })

  it('rejects an invalid postal code with a French message', async () => {
    const response = await PUT(put({ ...address, address_postal_code: '7417' }), params)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error.code).toBe('INVALID_BODY')
    expect(body.error.details.issues[0].message).toBe('Le code postal doit contenir 5 chiffres.')
    expect(mockSaveAddress).not.toHaveBeenCalled()
  })

  it('maps ownership errors and missing session', async () => {
    mockSaveAddress.mockRejectedValue(new GuideCustomizationError('FORBIDDEN', 'Accès interdit'))
    expect((await PUT(put(address), params)).status).toBe(403)
    mockGetSessionOwner.mockResolvedValue({ owner: null, error: NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'x', details: {} } }, { status: 401 }) })
    expect((await PUT(put(address), params)).status).toBe(401)
  })
})
