import { randomUUID } from 'node:crypto'
import { PrismaClient, type Prisma } from '@prisma/client'
import {
  createSeminarActivity,
  deleteSeminarActivity,
  setSeminarActivityPlacements,
  setSeminarActivityProviders,
  updateSeminarActivity,
} from '@/features/seminar-activities/queries/admin'
import { listPublicSeminarActivities } from '@/features/seminar-activities/queries/public'

// Run with SEMINAR_ACTIVITY_DATABASE_TEST=1 ; tout est annulé en fin de test (rollback).
let mockTx: Prisma.TransactionClient
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/features/local-seo/queries/landing-pages', () => ({ listPublishedLocalLandingSummaries: jest.fn().mockResolvedValue([]) }))
jest.mock('@/shared/lib/prisma', () => ({
  prisma: new Proxy({}, {
    get: (_target, key: string) => (key === '$transaction'
      ? (fn: (tx: Prisma.TransactionClient) => Promise<unknown>) => fn(mockTx)
      : (mockTx as unknown as Record<string, unknown>)[key]),
  }),
}))
const databaseTest = process.env.SEMINAR_ACTIVITY_DATABASE_TEST === '1' ? it : it.skip

databaseTest('soft delete, restauration des attributions, prestataires et lecture publique sur une vraie base', async () => {
  const db = new PrismaClient()
  const rollback = new Error('Intentional fixture rollback')
  const suffix = randomUUID().slice(0, 8)
  try {
    await expect(db.$transaction(async tx => {
      mockTx = tx
      const poi = await tx.pointOfInterest.findFirstOrThrow({ where: { deleted_at: null }, select: { id: true } })
      const destination = await tx.localLandingDestination.findFirst({ where: { deleted_at: null }, select: { id: true } })

      const created = await createSeminarActivity({ title: `Test activité ${suffix}`, category: 'WINTER', description: 'd', season_label: 'Hiver', level_label: 'Accessible', price_per_person_cents: 4500 })
      expect(created).toMatchObject({ is_published: false, image_url: null, price_per_person_cents: 4500, placements: [], providers: [] })
      await expect(updateSeminarActivity(created.id, { is_published: true })).rejects.toMatchObject({ code: 'IMAGE_REQUIRED' })

      await tx.seminarActivity.update({ where: { id: created.id }, data: { image_url: 'https://cdn/test.webp' } })
      await updateSeminarActivity(created.id, { is_published: true })

      const linked = await setSeminarActivityProviders(created.id, { providers: [{ poi_id: poi.id, notes: 'Contact interne' }] })
      expect(linked.providers).toEqual([expect.objectContaining({ poi_id: poi.id, notes: 'Contact interne' })])

      const destinationIds = destination ? [destination.id] : []
      await setSeminarActivityPlacements(created.id, { include_hub: true, destination_ids: destinationIds })
      expect((await listPublicSeminarActivities(null)).map(item => item.id)).toContain(created.id)
      if (destination) expect((await listPublicSeminarActivities(destination.id)).map(item => item.id)).toContain(created.id)

      // Retrait puis réattribution : la même ligne est restaurée (BR-11).
      const before = await tx.seminarActivityPlacement.findFirstOrThrow({ where: { activity_id: created.id, surface_key: 'hub' } })
      await setSeminarActivityPlacements(created.id, { include_hub: false, destination_ids: destinationIds })
      expect((await listPublicSeminarActivities(null)).map(item => item.id)).not.toContain(created.id)
      await setSeminarActivityPlacements(created.id, { include_hub: true, destination_ids: destinationIds })
      const after = await tx.seminarActivityPlacement.findFirstOrThrow({ where: { activity_id: created.id, surface_key: 'hub' } })
      expect(after.id).toBe(before.id)
      expect(after.deleted_at).toBeNull()

      await deleteSeminarActivity(created.id)
      expect(await tx.seminarActivity.findUniqueOrThrow({ where: { id: created.id } })).toMatchObject({ deleted_at: expect.any(Date) })
      expect((await listPublicSeminarActivities(null)).map(item => item.id)).not.toContain(created.id)
      throw rollback
    }, { timeout: 30000 })).rejects.toBe(rollback)
  } finally {
    await db.$disconnect()
  }
}, 60000)
