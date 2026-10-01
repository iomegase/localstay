import { NextRequest, NextResponse } from 'next/server'
const mockOwner = jest.fn()
const mockAdmin = jest.fn()
const mockReorder = jest.fn()
jest.mock('@/features/dashboard-owner/lib/get-session-owner', () => ({ getSessionOwner: () => mockOwner() }))
jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: () => mockAdmin() }))
jest.mock('@/features/lodging-showcase/queries/owner-public-profile', () => ({ reorderLodgingPhotos: (...args: unknown[]) => mockReorder(...args) }))
import { PATCH as ownerPatch } from '@/app/api/dashboard/lodgings/[id]/public-profile/photos/route'
import { PATCH as adminPatch } from '@/app/api/admin/lodgings/[id]/public-profile/photos/route'
const id = 'b76af918-ab21-40c3-8b59-708f61572444'
const params = Promise.resolve({ id: 'lodging' })
const request = (body: unknown) => new NextRequest('https://example.com/photos', { method: 'PATCH', body: JSON.stringify(body) })
beforeEach(() => { jest.clearAllMocks(); mockOwner.mockResolvedValue({ owner: { id: 'owner' } }); mockAdmin.mockResolvedValue({ user: { id: 'admin' } }); mockReorder.mockResolvedValue(true) })
it.each([['owner', ownerPatch], ['admin', adminPatch]] as const)('%s forwards an authorized order', async (mode, patch) => {
  const res = await patch(request({ photo_ids: [id] }), { params })
  expect(await res.json()).toEqual({ ok: true })
  expect(mockReorder).toHaveBeenCalledWith(...(mode === 'owner' ? ['lodging', [id], 'owner'] : ['lodging', [id]]))
})
it.each([ownerPatch, adminPatch])('rejects duplicates, empty lists and invalid ids', async patch => {
  for (const ids of [[], [id, id], ['invalid']]) expect((await patch(request({ photo_ids: ids }), { params })).status).toBe(400)
  expect(mockReorder).not.toHaveBeenCalled()
})
it('rejects unauthorized sessions and stale galleries', async () => {
  mockOwner.mockResolvedValue({ owner: null, error: NextResponse.json({}, { status: 401 }) })
  expect((await ownerPatch(request({ photo_ids: [id] }), { params })).status).toBe(401)
  mockReorder.mockResolvedValue(false)
  expect((await adminPatch(request({ photo_ids: [id] }), { params })).status).toBe(404)
})
it('returns a structured error after a failed transaction', async () => {
  mockReorder.mockRejectedValue(new Error('Serialization conflict'))
  const response = await ownerPatch(request({ photo_ids: [id] }), { params })
  expect(response.status).toBe(500)
  expect(await response.json()).toMatchObject({ error: { code: 'PHOTO_ORDER_FAILED' } })
})
