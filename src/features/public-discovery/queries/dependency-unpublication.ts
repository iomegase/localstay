import { Prisma } from '@prisma/client'

type DependencyCause = {
  type: 'category' | 'subcategory'
  id: string
  reason: 'inactive' | 'deleted'
}

const publishedDependencyPoiSelect = {
  id: true,
  slug: true,
  discovery_status: true,
  discovery_published_at: true,
  city: { select: { slug: true } },
  category: { select: { slug: true } },
} satisfies Prisma.PointOfInterestSelect

type PublishedDependencyPoi = Prisma.PointOfInterestGetPayload<{
  select: typeof publishedDependencyPoiSelect
}>

export async function findPublishedDependencyPois(
  tx: Prisma.TransactionClient,
  where: Prisma.PointOfInterestWhereInput,
): Promise<PublishedDependencyPoi[]> {
  return tx.pointOfInterest.findMany({
    where: { ...where, discovery_status: 'PUBLISHED' },
    select: publishedDependencyPoiSelect,
  })
}

export async function unpublishPoisForDependency(
  tx: Prisma.TransactionClient,
  pois: PublishedDependencyPoi[],
  adminId: string,
  cause: DependencyCause,
): Promise<string[]> {
  const paths = new Set<string>()

  for (const poi of pois) {
    const updated = await tx.pointOfInterest.update({
      where: { id: poi.id },
      data: { discovery_status: 'DRAFT', discovery_published_at: null },
      select: { discovery_status: true, discovery_published_at: true },
    })
    await tx.poiAcquisitionAuditLog.create({
      data: {
        admin_id: adminId,
        actor_type: 'ADMIN',
        action: 'poi_discovery_auto_unpublished',
        target_type: 'poi',
        target_id: poi.id,
        before: {
          discovery_status: poi.discovery_status,
          discovery_published_at: poi.discovery_published_at?.toISOString() ?? null,
          cause,
        },
        after: {
          discovery_status: updated.discovery_status,
          discovery_published_at: updated.discovery_published_at?.toISOString() ?? null,
          cause,
        },
      },
    })

    paths.add(`/decouvrir/${poi.city.slug}`)
    paths.add(`/decouvrir/${poi.city.slug}/${poi.category.slug}`)
    paths.add(`/decouvrir/${poi.city.slug}/${poi.category.slug}/${poi.slug}`)
  }

  return Array.from(paths)
}
