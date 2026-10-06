import { NextRequest } from 'next/server'
import { setMaintenanceState } from '@/features/maintenance/queries/maintenance'

const mockSession = jest.fn()
jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: () => mockSession() }))

import { GET, PUT } from '@/app/api/admin/maintenance/route'

const put = (body: unknown) => new NextRequest('http://localhost/api/admin/maintenance', {
  method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
})

// Spec 087 — API admin du mode maintenance.
describe('087 — /api/admin/maintenance', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSession.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' }, error: null })
  })

  it('GET renvoie l’état', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    expect((await res.json()).data).toMatchObject({ enabled: false })
  })

  it('PUT enregistre l’état et le message', async () => {
    jest.mocked(setMaintenanceState).mockResolvedValue({ enabled: true, message: 'Retour à 18 h.' })
    const res = await PUT(put({ enabled: true, message: 'Retour à 18 h.' }))
    expect(res.status).toBe(200)
    expect(setMaintenanceState).toHaveBeenCalledWith({ enabled: true, message: 'Retour à 18 h.' }, 'admin-1')
    expect((await res.json()).data).toEqual({ enabled: true, message: 'Retour à 18 h.' })
  })

  it('PUT refuse un message trop long ou un état manquant (400)', async () => {
    expect((await PUT(put({ enabled: true, message: 'x'.repeat(501) }))).status).toBe(400)
    expect((await PUT(put({ message: null }))).status).toBe(400)
    expect(setMaintenanceState).not.toHaveBeenCalled()
  })

  it('hors admin : refusé', async () => {
    const { NextResponse } = await import('next/server')
    mockSession.mockResolvedValue({ user: null, error: NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 }) })
    expect((await PUT(put({ enabled: true, message: null }))).status).toBe(403)
    expect(setMaintenanceState).not.toHaveBeenCalled()
  })
})
