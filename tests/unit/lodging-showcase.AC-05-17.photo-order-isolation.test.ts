const mockLodging = jest.fn()
const mockProfile = jest.fn()
const mockPhotos = jest.fn()
const mockUpdate = jest.fn()
const mockRevalidate = jest.fn()
const transactionClient = { lodgingPhoto: { findMany: mockPhotos, update: mockUpdate } }
const mockTransaction = jest.fn((work: (tx: typeof transactionClient) => Promise<boolean>) => work(transactionClient))
jest.mock('@/shared/lib/prisma', () => ({ prisma: {
  lodging: { findFirst: (...args: unknown[]) => mockLodging(...args) },
  lodgingPublicProfile: { findFirst: (...args: unknown[]) => mockProfile(...args) },
  $transaction: (...args: unknown[]) => mockTransaction(...args as [((tx: typeof transactionClient) => Promise<boolean>)]),
} }))
jest.mock('@/features/lodging-showcase/lib/revalidation', () => ({ revalidatePublicLodgingPaths: (...args: unknown[]) => mockRevalidate(...args) }))
import { reorderLodgingPhotos } from '@/features/lodging-showcase/queries/owner-public-profile'
beforeEach(() => {
  jest.clearAllMocks()
  mockLodging.mockResolvedValue({ id: 'lodging', city: { slug: 'combloux' } })
  mockProfile.mockResolvedValue({ id: 'profile', slug: 'chalet', city: { slug: 'combloux' } })
  mockPhotos.mockResolvedValue([{ id: 'a' }, { id: 'b' }])
  mockUpdate.mockResolvedValue({})
})
it('updates only order within a serializable transaction and preserves cover and publication', async () => {
  expect(await reorderLodgingPhotos('lodging', ['b', 'a'], 'owner')).toBe(true)
  expect(mockLodging).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ owner_id: 'owner', id: 'lodging' }) }))
  expect(mockPhotos).toHaveBeenCalledWith({ where: { profile_id: 'profile', deleted_at: null }, select: { id: true } })
  expect(mockUpdate.mock.calls).toEqual([[{ where: { id: 'b' }, data: { sort_order: 0 } }], [{ where: { id: 'a' }, data: { sort_order: 1 } }]])
  expect(mockTransaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable', timeout: 15_000 })
  expect(mockRevalidate).toHaveBeenCalled()
})
it.each([['a'], ['a','foreign'], ['a','a']])('rejects an incomplete or foreign set without writing', async (...ids) => {
  expect(await reorderLodgingPhotos('lodging', ids, 'owner')).toBe(false)
  expect(mockUpdate).not.toHaveBeenCalled()
  expect(mockRevalidate).not.toHaveBeenCalled()
})
it('rejects a foreign lodging before opening a transaction', async () => {
  mockLodging.mockResolvedValue(null)
  expect(await reorderLodgingPhotos('lodging', ['a','b'], 'other')).toBe(false)
  expect(mockTransaction).not.toHaveBeenCalled()
})
