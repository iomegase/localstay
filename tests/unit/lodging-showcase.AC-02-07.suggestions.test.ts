const mockFindMany = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({ prisma: { lodgingPublicProfile: { findMany: (...args: unknown[]) => mockFindMany(...args) } } }))
import { listSuggestedLodgings } from '@/features/lodging-showcase/queries/public-lodgings'
const row = (id: string) => ({ id, slug: id, title: id, public_area_label: null, city: { name: 'Combloux' }, photos: [{ url: '/cover.jpg' }] })
beforeEach(() => mockFindMany.mockReset())
it('prioritizes the same city and fills remaining slots from other active published lodgings', async () => {
  mockFindMany.mockResolvedValueOnce([row('local')]).mockResolvedValueOnce([row('other')])
  const results = await listSuggestedLodgings('current', 'combloux')
  expect(results.map(r => r.id)).toEqual(['local', 'other'])
  expect(mockFindMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ take: 4, where: { id: { not: 'current' }, publication_status: 'published', deleted_at: null, lodging: { is_active: true, deleted_at: null }, city: { slug: 'combloux', is_active: true, deleted_at: null } } }))
  expect(mockFindMany).toHaveBeenNthCalledWith(2, expect.objectContaining({ take: 3, where: expect.objectContaining({ id: { not: 'current' }, publication_status: 'published', city: { slug: { not: 'combloux' }, is_active: true, deleted_at: null } }) }))
  expect(results[0]).toMatchObject({ href: '/logements/local', coverPhotoUrl: '/cover.jpg', location: 'Combloux' })
})
it('does not load other cities when four local suggestions are available', async () => {
  mockFindMany.mockResolvedValueOnce(['a','b','c','d'].map(row))
  expect(await listSuggestedLodgings('current','combloux')).toHaveLength(4)
  expect(mockFindMany).toHaveBeenCalledTimes(1)
})
it('uses the public area and supports missing photos without exposing a private address', async () => {
  mockFindMany.mockResolvedValueOnce([{ ...row('local'), public_area_label: 'Centre village', photos: [] }]).mockResolvedValueOnce([])
  expect(await listSuggestedLodgings('current','combloux')).toEqual([expect.objectContaining({ location: 'Centre village', coverPhotoUrl: null })])
})
