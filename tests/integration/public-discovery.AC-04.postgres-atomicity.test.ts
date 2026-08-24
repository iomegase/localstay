import { randomUUID } from 'node:crypto'
import { prisma } from '@/shared/lib/prisma'
import { updatePoiDiscoveryPublication } from '@/features/public-discovery/queries/admin-publication'
import { runPoiMutationWithDiscoveryReconciliation } from '@/features/public-discovery/queries/mutation-reconciliation'

const isolatedDatabaseConfigured = Boolean(process.env.TEST_DATABASE_URL)
  && process.env.DATABASE_URL === process.env.TEST_DATABASE_URL

const describeWithIsolatedDatabase = isolatedDatabaseConfigured ? describe : describe.skip

describeWithIsolatedDatabase('041 AC-04 PostgreSQL publication atomicity', () => {
  it('publishes as ADMIN then atomically withdraws and audits an invalid SYSTEM mutation', async () => {
    const suffix = randomUUID().slice(0, 8)
    const cityId = randomUUID()
    const categoryId = randomUUID()
    const adminId = randomUUID()
    const poiId = randomUUID()

    await prisma.city.create({
      data: {
        id: cityId,
        name: `Ville staging ${suffix}`,
        slug: `ville-staging-${suffix}`,
        postal_code: '74170',
        latitude: 45.892,
        longitude: 6.713,
      },
    })
    await prisma.category.create({
      data: {
        id: categoryId,
        name: `Catégorie staging ${suffix}`,
        slug: `categorie-staging-${suffix}`,
        icon: 'utensils',
      },
    })
    await prisma.user.create({
      data: {
        id: adminId,
        supabase_id: `staging-${suffix}`,
        email: `staging-${suffix}@example.test`,
        role: 'admin',
      },
    })
    await prisma.pointOfInterest.create({
      data: {
        id: poiId,
        name: `POI staging ${suffix}`,
        slug: `poi-staging-${suffix}`,
        description: 'Fixture PostgreSQL isolée pour la publication Découvrir.',
        address: '10 avenue du Mont-Blanc, 74170 Saint-Gervais-les-Bains',
        latitude: 45.893,
        longitude: 6.714,
        phone: '+33450000000',
        photos: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'],
        tags: [],
        geocode_status: 'success',
        city_id: cityId,
        category_id: categoryId,
      },
    })

    const published = await updatePoiDiscoveryPublication(poiId, 'PUBLISHED', adminId)
    expect(published.discovery_status).toBe('PUBLISHED')
    expect(published.discovery_published_at).not.toBeNull()

    const reconciled = await runPoiMutationWithDiscoveryReconciliation({
      poiWhere: { id: poiId },
      auditActor: { type: 'SYSTEM' },
      cause: { source: 'postgres-integration', reason: 'contact_removed' },
      mutate: tx => tx.pointOfInterest.update({
        where: { id: poiId },
        data: { phone: null, website: null },
      }),
    })

    expect(reconciled.discoveryRevalidationPaths).toEqual([
      `/decouvrir/ville-staging-${suffix}`,
      `/decouvrir/ville-staging-${suffix}/categorie-staging-${suffix}`,
      `/decouvrir/ville-staging-${suffix}/categorie-staging-${suffix}/poi-staging-${suffix}`,
    ])
    await expect(prisma.pointOfInterest.findUniqueOrThrow({
      where: { id: poiId },
      select: { discovery_status: true, discovery_published_at: true },
    })).resolves.toEqual({ discovery_status: 'DRAFT', discovery_published_at: null })

    const audits = await prisma.poiAcquisitionAuditLog.findMany({
      where: { target_id: poiId },
      orderBy: { created_at: 'asc' },
      select: { actor_type: true, admin_id: true, action: true },
    })
    expect(audits).toEqual([
      { actor_type: 'ADMIN', admin_id: adminId, action: 'poi_discovery_published' },
      { actor_type: 'SYSTEM', admin_id: null, action: 'poi_discovery_auto_unpublished' },
    ])

    await expect(prisma.poiAcquisitionAuditLog.create({
      data: {
        actor_type: 'SYSTEM',
        admin_id: adminId,
        action: 'invalid_system_identity',
        target_type: 'poi',
        target_id: poiId,
      },
    })).rejects.toBeDefined()
  })
})
