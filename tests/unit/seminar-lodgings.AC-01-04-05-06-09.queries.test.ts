import { listSeminarLodgings, setSeminarSelection } from '@/features/lodging-showcase/queries/seminar-lodgings'
import { prisma } from '@/shared/lib/prisma'
import { revalidatePath } from 'next/cache'
import { revalidatePublicLodgingPaths } from '@/features/lodging-showcase/lib/revalidation'

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/shared/lib/prisma', () => {
  const tx = { lodging: { updateMany: jest.fn(), findUniqueOrThrow: jest.fn() } }
  return { prisma: { ...tx, lodgingPublicProfile: { findMany: jest.fn() }, $transaction: jest.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)) } }
})
beforeEach(() => jest.resetAllMocks())
// Restore the transaction callback after reset, keeping mutations observable.
beforeEach(() => {
  ;(prisma.$transaction as jest.Mock).mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma))
})
it.each([undefined, 'saint-gervais-city-id'])('queries only selected public active lodgings, scoped by City.id %s', async cityId => {
  ;(prisma.lodgingPublicProfile.findMany as jest.Mock).mockResolvedValue([
    { id: 'profile', title: 'T2 cosy', slug: 't2-cosy', lodging: { city: { name: 'Saint-Gervais' } }, photos: [{ url: '/cover.jpg', alt: 'Salon' }] },
    { id: 'profile-no-photo', title: 'Z chalet', slug: 'z-chalet', lodging: { city: { name: 'Saint-Gervais' } }, photos: [] },
  ])
  expect(await listSeminarLodgings(cityId)).toEqual([
    { id: 'profile', title: 'T2 cosy', href: '/logements/t2-cosy', cityName: 'Saint-Gervais', photo: { url: '/cover.jpg', alt: 'Salon' } },
    { id: 'profile-no-photo', title: 'Z chalet', href: '/logements/z-chalet', cityName: 'Saint-Gervais', photo: null },
  ])
  expect(prisma.lodgingPublicProfile.findMany).toHaveBeenCalledWith(expect.objectContaining({
    where: {
      publication_status: 'published', deleted_at: null, city: { is_active: true, deleted_at: null },
      lodging: { seminar_selected: true, is_active: true, deleted_at: null, city: { is_active: true, deleted_at: null }, ...(cityId ? { city_id: cityId } : {}) },
    },
    orderBy: [{ title: 'asc' }, { id: 'asc' }],
  }))
  expect((prisma.lodgingPublicProfile.findMany as jest.Mock).mock.calls[0][0]).not.toHaveProperty('take')
})
it.each([true, false])('writes only selection %s, supports repetition and invalidates both public surfaces', async selected => {
  ;(prisma.lodging.updateMany as jest.Mock).mockResolvedValue({ count: 1 })
  ;(prisma.lodging.findUniqueOrThrow as jest.Mock).mockResolvedValue({ id: 'lodging', seminar_selected: selected, city: { slug: 'saint-gervais' } })
  for (let i = 0; i < 2; i++) expect(await setSeminarSelection('lodging', selected)).toEqual({ id: 'lodging', seminar_selected: selected })
  expect(prisma.lodging.updateMany).toHaveBeenCalledWith({ where: { id: 'lodging', deleted_at: null }, data: { seminar_selected: selected } })
  expect(revalidatePath).toHaveBeenCalledWith('/seminaires', 'page')
  expect(revalidatePath).toHaveBeenCalledWith('/seminaires/[city-slug]', 'page')
  expect(revalidatePath).toHaveBeenCalledWith('/admin/lodgings', 'page')
})
it('does not update or invalidate a missing/soft-deleted lodging', async () => {
  ;(prisma.lodging.updateMany as jest.Mock).mockResolvedValue({ count: 0 })
  expect(await setSeminarSelection('missing', true)).toBeNull()
  expect(prisma.lodging.findUniqueOrThrow).not.toHaveBeenCalled()
  expect(revalidatePath).not.toHaveBeenCalled()
})
it('publication and moves invalidate all seminar city pages through the shared helper', () => {
  revalidatePublicLodgingPaths(['old-city', 'new-city'])
  expect(revalidatePath).toHaveBeenCalledWith('/seminaires/[city-slug]', 'page')
  expect(revalidatePath).toHaveBeenCalledWith('/seminaires', 'page')
})
