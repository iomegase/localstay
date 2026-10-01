import { randomUUID } from 'node:crypto'
import { PrismaClient, type Prisma } from '@prisma/client'
import { listSeminarLodgings, setSeminarSelection } from '@/features/lodging-showcase/queries/seminar-lodgings'

// Run with SEMINAR_DATABASE_TEST=1; every fixture and mutation is rolled back.
let mockTransaction: Prisma.TransactionClient
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/shared/lib/prisma', () => ({ prisma: {
  lodgingPublicProfile: { findMany: (args: Prisma.LodgingPublicProfileFindManyArgs) => mockTransaction.lodgingPublicProfile.findMany(args) },
  $transaction: (fn: (tx: Prisma.TransactionClient) => Promise<unknown>) => fn(mockTransaction),
} }))
const databaseTest = process.env.SEMINAR_DATABASE_TEST === '1' ? it : it.skip

databaseTest('isolates cities and eligibility, preserves content, defaults false and rolls back all data', async () => {
  const db = new PrismaClient()
  const rollback = new Error('Intentional fixture rollback')
  const suffix = randomUUID()
  try {
    await expect(db.$transaction(async tx => {
      mockTransaction = tx
      const user = await tx.user.create({ data: { email: `seminar-${suffix}@example.test`, supabase_id: randomUUID() } })
      const city = await tx.city.create({ data: { name: 'Saint-Gervais test', slug: `seminar-city-${suffix}`, postal_code: '74170', latitude: 0, longitude: 0 } })
      const other = await tx.city.create({ data: { name: 'Autre commune', slug: `seminar-other-${suffix}`, postal_code: '74120', latitude: 0, longitude: 0 } })
      const lodging = await tx.lodging.create({ data: { name: 'Nom interne', owner_id: user.id, city_id: city.id } })
      expect(lodging.seminar_selected).toBe(false)
      const profile = await tx.lodgingPublicProfile.create({ data: {
        lodging_id: lodging.id, city_id: city.id, slug: `seminar-profile-${suffix}`,
        publication_status: 'published', title: 'Titre public', short_description: 'Description existante',
        description: 'Contenu à conserver', property_type: 'Appartement', max_guests: 4,
      } })
      expect(await listSeminarLodgings(city.id)).toEqual([])
      await setSeminarSelection(lodging.id, true)
      await setSeminarSelection(lodging.id, true)
      expect((await listSeminarLodgings()).map(row => row.id)).toContain(profile.id)
      expect((await listSeminarLodgings(city.id)).map(row => row.id)).toEqual([profile.id])
      expect(await listSeminarLodgings(other.id)).toEqual([])
      expect(await tx.lodgingPublicProfile.findUnique({ where: { id: profile.id } })).toEqual(profile)
      for (const status of ['draft', 'review', 'archived'] as const) {
        await tx.lodgingPublicProfile.update({ where: { id: profile.id }, data: { publication_status: status } })
        expect(await listSeminarLodgings(city.id)).toEqual([])
        expect((await tx.lodging.findUniqueOrThrow({ where: { id: lodging.id } })).seminar_selected).toBe(true)
      }
      await tx.lodgingPublicProfile.update({ where: { id: profile.id }, data: { publication_status: 'published' } })
      for (const data of [{ is_active: false }, { deleted_at: new Date() }]) {
        await tx.lodging.update({ where: { id: lodging.id }, data })
        expect(await listSeminarLodgings(city.id)).toEqual([])
        await tx.lodging.update({ where: { id: lodging.id }, data: { is_active: true, deleted_at: null } })
        await tx.city.update({ where: { id: city.id }, data })
        expect(await listSeminarLodgings(city.id)).toEqual([])
        await tx.city.update({ where: { id: city.id }, data: { is_active: true, deleted_at: null } })
      }
      await tx.lodgingPublicProfile.update({ where: { id: profile.id }, data: { deleted_at: new Date() } })
      expect(await listSeminarLodgings(city.id)).toEqual([])
      await tx.lodgingPublicProfile.update({ where: { id: profile.id }, data: { deleted_at: null } })
      expect((await listSeminarLodgings(city.id)).map(row => row.id)).toEqual([profile.id])
      await setSeminarSelection(lodging.id, false)
      expect(await listSeminarLodgings(city.id)).toEqual([])
      await tx.lodging.update({ where: { id: lodging.id }, data: { deleted_at: new Date() } })
      expect(await setSeminarSelection(lodging.id, true)).toBeNull()
      throw rollback
    }, { timeout: 60000 })).rejects.toBe(rollback)
    expect(await db.user.count({ where: { email: `seminar-${suffix}@example.test` } })).toBe(0)
  } finally { await db.$disconnect() }
}, 90000)
