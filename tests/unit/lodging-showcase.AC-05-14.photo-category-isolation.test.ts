const mockLodging = jest.fn()
const mockProfile = jest.fn()
const mockUpdate = jest.fn()
const mockRevalidate = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({ prisma: {
  lodging: { findFirst: (...args: unknown[]) => mockLodging(...args) },
  lodgingPublicProfile: { findFirst: (...args: unknown[]) => mockProfile(...args) },
  lodgingPhoto: { updateMany: (...args: unknown[]) => mockUpdate(...args) },
} }))
jest.mock('@/features/lodging-showcase/lib/revalidation', () => ({ revalidatePublicLodgingPaths: (...args: unknown[]) => mockRevalidate(...args) }))
import { updateOwnerPhotoCategory, updateAdminPhotoCategory } from '@/features/lodging-showcase/queries/owner-public-profile'

const category = { room_type: 'bedroom' as const, room_label: 'Chambre 10' }
beforeEach(() => {
  jest.clearAllMocks()
  mockLodging.mockResolvedValue({ id: 'lodging', city: { slug: 'annecy' } })
  mockProfile.mockResolvedValue({ id: 'profile', slug: 'chalet', city: { slug: 'annecy' } })
  mockUpdate.mockResolvedValue({ count: 1 })
})
it('limits an owner mutation to the active photo of their own lodging without changing cover or order', async () => {
  expect(await updateOwnerPhotoCategory('owner', 'lodging', 'photo', category)).toBe(true)
  expect(mockLodging).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ owner_id: 'owner', id: 'lodging', deleted_at: null }) }))
  expect(mockProfile).toHaveBeenCalledWith(expect.objectContaining({ where: { lodging_id: 'lodging', deleted_at: null } }))
  expect(mockUpdate).toHaveBeenCalledWith({ where: { id: 'photo', profile_id: 'profile', deleted_at: null }, data: category })
  expect(mockRevalidate).toHaveBeenCalledWith(['annecy', 'annecy'], ['chalet'])
})
it('does not mutate when the owner cannot access the lodging', async () => {
  mockLodging.mockResolvedValue(null)
  expect(await updateOwnerPhotoCategory('other-owner', 'lodging', 'photo', category)).toBe(false)
  expect(mockUpdate).not.toHaveBeenCalled()
})
it('does not report success or revalidate for a deleted or foreign photo', async () => {
  mockUpdate.mockResolvedValue({ count: 0 })
  expect(await updateAdminPhotoCategory('lodging', 'foreign-photo', category)).toBe(false)
  expect(mockRevalidate).not.toHaveBeenCalled()
})
