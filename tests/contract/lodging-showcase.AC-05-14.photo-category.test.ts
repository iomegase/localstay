import { NextRequest, NextResponse } from 'next/server'

const mockOwner = jest.fn()
const mockAdmin = jest.fn()
const mockUpdateOwner = jest.fn()
const mockUpdateAdmin = jest.fn()
jest.mock('@/features/dashboard-owner/lib/get-session-owner', () => ({ getSessionOwner: () => mockOwner() }))
jest.mock('@/features/merchant/lib/session', () => ({ getSessionAdmin: () => mockAdmin() }))
jest.mock('@/features/lodging-showcase/queries/owner-public-profile', () => ({
  updateOwnerPhotoCategory: (...args: unknown[]) => mockUpdateOwner(...args),
  updateAdminPhotoCategory: (...args: unknown[]) => mockUpdateAdmin(...args),
}))
import { PUT as ownerPut } from '@/app/api/dashboard/lodgings/[id]/public-profile/photos/[photoId]/route'
import { PUT as adminPut } from '@/app/api/admin/lodgings/[id]/public-profile/photos/[photoId]/route'

const category = { room_type: 'common_area', room_label: 'Salon' }
const params = Promise.resolve({ id: 'lodging-1', photoId: 'photo-1' })
function request(body: string) {
  return new NextRequest('https://example.com/api/photos', { method: 'PUT', body, headers: { 'Content-Type': 'application/json' } })
}
beforeEach(() => {
  jest.clearAllMocks()
  mockOwner.mockResolvedValue({ owner: { id: 'owner-1' } })
  mockAdmin.mockResolvedValue({ user: { id: 'admin-1' } })
  mockUpdateOwner.mockResolvedValue(true)
  mockUpdateAdmin.mockResolvedValue(true)
})

it.each([['owner', ownerPut, mockUpdateOwner], ['admin', adminPut, mockUpdateAdmin]] as const)('%s updates the category using its authorized query', async (mode, put, update) => {
  const response = await put(request(JSON.stringify(category)), { params })
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ ok: true })
  expect(update).toHaveBeenCalledWith(...(mode === 'owner' ? ['owner-1', 'lodging-1', 'photo-1', category] : ['lodging-1', 'photo-1', category]))
})
it.each([ownerPut, adminPut])('rejects malformed JSON, invalid categories and extra fields', async put => {
  for (const body of ['{', JSON.stringify({ ...category, room_type: 'invalid' }), JSON.stringify({ ...category, is_cover: true }), JSON.stringify({ ...category, room_label: 'x'.repeat(41) })]) {
    const response = await put(request(body), { params })
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } })
  }
  expect(mockUpdateOwner).not.toHaveBeenCalled()
  expect(mockUpdateAdmin).not.toHaveBeenCalled()
})
it.each([[ownerPut, mockUpdateOwner], [adminPut, mockUpdateAdmin]] as const)('returns 404 for an inaccessible or deleted photo', async (put, update) => {
  update.mockResolvedValue(false)
  const response = await put(request(JSON.stringify(category)), { params })
  expect(response.status).toBe(404)
  expect(await response.json()).toMatchObject({ error: { code: 'PHOTO_NOT_FOUND' } })
})
it('requires an owner session or an admin role', async () => {
  mockOwner.mockResolvedValue({ owner: null, error: NextResponse.json({}, { status: 401 }) })
  mockAdmin.mockResolvedValue({ user: null, error: NextResponse.json({}, { status: 403 }) })
  expect((await ownerPut(request(JSON.stringify(category)), { params })).status).toBe(401)
  expect((await adminPut(request(JSON.stringify(category)), { params })).status).toBe(403)
  expect(mockUpdateOwner).not.toHaveBeenCalled()
  expect(mockUpdateAdmin).not.toHaveBeenCalled()
})
