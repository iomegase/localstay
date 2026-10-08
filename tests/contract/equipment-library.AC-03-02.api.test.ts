import { NextRequest } from 'next/server'

const mockSession = jest.fn()
const mockUpdate = jest.fn()
jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: () => mockSession() }))
jest.mock('@/features/equipment-library/queries/library', () => {
  const actual = jest.requireActual('@/features/equipment-library/queries/library')
  return { ...actual, updateEquipmentTemplate: (...a: unknown[]) => mockUpdate(...a) }
})
jest.mock('@/shared/lib/prisma', () => ({ prisma: {} }))

import { PATCH } from '@/app/api/admin/equipment-library/[id]/route'
import { EquipmentLibraryError } from '@/features/equipment-library/queries/library'

const call = (body: unknown) => PATCH(
  new NextRequest('http://localhost/api/admin/equipment-library/t1', { method: 'PATCH', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }),
  { params: Promise.resolve({ id: 't1' }) },
)

describe('PATCH /api/admin/equipment-library/{id} — spec 095', () => {
  beforeEach(() => { jest.clearAllMocks(); mockSession.mockResolvedValue({ user: { id: 'admin-1' }, error: null }) })

  it('valide un équipement', async () => {
    mockUpdate.mockResolvedValue({ id: 't1', status: 'approved' })
    const res = await call({ status: 'approved' })
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith('t1', { status: 'approved' }, 'admin-1')
  })

  it('400 sur icône inconnue, 404 si introuvable, 409 si nom déjà pris', async () => {
    expect((await call({ icon: 'licorne' })).status).toBe(400)
    mockUpdate.mockRejectedValueOnce(new EquipmentLibraryError('NOT_FOUND', 404))
    expect((await call({ status: 'approved' })).status).toBe(404)
    mockUpdate.mockRejectedValueOnce(new EquipmentLibraryError('TITLE_ALREADY_EXISTS', 409))
    const res = await call({ title: 'Télévision' })
    expect(res.status).toBe(409)
    expect((await res.json()).error.message).toBe('Un équipement porte déjà ce nom')
  })

  it('réservé aux admins', async () => {
    const { NextResponse } = await import('next/server')
    mockSession.mockResolvedValue({ user: null, error: NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 }) })
    expect((await call({ status: 'approved' })).status).toBe(401)
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
