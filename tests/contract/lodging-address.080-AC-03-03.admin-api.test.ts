import { NextRequest, NextResponse } from 'next/server'

const mockSession = jest.fn()
const mockSaveAsAdmin = jest.fn()
jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: () => mockSession() }))
jest.mock('@/features/guide-customization/queries/customization', () => ({ saveLodgingAddressAsAdmin: (...args: unknown[]) => mockSaveAsAdmin(...args) }))

import { PUT } from '@/app/api/admin/lodgings/[id]/address/route'
import { GuideCustomizationError } from '@/features/guide-customization/types'

const id = '11111111-1111-4111-8111-111111111111'
const put = (body: unknown) => new NextRequest(`http://localhost/api/admin/lodgings/${id}/address`, {
  method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
})
const params = { params: Promise.resolve({ id }) }
const address = { address_number: '12', address_street: 'rue des Alpages', address_postal_code: '74170', address_city: 'Saint-Gervais-les-Bains' }

describe('080 AC-03-03 — PUT /api/admin/lodgings/{id}/address', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('lets the admin save the address of any lodging', async () => {
    mockSaveAsAdmin.mockResolvedValue({ ...address, lodging_address: '12 rue des Alpages, 74170 Saint-Gervais-les-Bains' })
    const response = await PUT(put(address), params)
    expect(response.status).toBe(200)
    expect(mockSaveAsAdmin).toHaveBeenCalledWith(id, address)
  })

  it('validates the postal code and maps a missing lodging', async () => {
    expect((await PUT(put({ ...address, address_postal_code: 'abc' }), params)).status).toBe(400)
    mockSaveAsAdmin.mockRejectedValue(new GuideCustomizationError('NOT_FOUND', 'Logement introuvable'))
    expect((await PUT(put(address), params)).status).toBe(404)
  })

  it('rejects non-admin sessions', async () => {
    mockSession.mockResolvedValue({ user: null, error: NextResponse.json({ error: { code: 'FORBIDDEN', message: 'x', details: {} } }, { status: 403 }) })
    expect((await PUT(put(address), params)).status).toBe(403)
    expect(mockSaveAsAdmin).not.toHaveBeenCalled()
  })
})
