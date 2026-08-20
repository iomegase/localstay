import { Prisma } from '@prisma/client'
import { runSerializableTransaction } from '@/shared/lib/serializable-transaction'
import { getPoiDiscoveryEligibility } from '../lib/eligibility'
import { poiDiscoveryEligibilitySelect } from './admin-publication'

type DiscoveryMutationCause = {
  source: string
  reason: string
}

type ReconciledMutation<T> = {
  result: T
  discoveryRevalidationPaths: string[]
}

type PublishedPoiSnapshot = Prisma.PointOfInterestGetPayload<{
  select: typeof poiDiscoveryEligibilitySelect
}>

export async function runPoiMutationWithDiscoveryReconciliation<T>(input: {
  poiId: string
  auditActorId: string
  cause: DiscoveryMutationCause
  mutate: (tx: Prisma.TransactionClient) => Promise<T>
}): Promise<ReconciledMutation<T>> {
  return runSerializableTransaction(async tx => {
    const before = await tx.pointOfInterest.findFirst({
      where: { id: input.poiId, discovery_status: 'PUBLISHED' },
      select: poiDiscoveryEligibilitySelect,
    })

    const result = await input.mutate(tx)
    if (!before) return { result, discoveryRevalidationPaths: [] }

    const after = await tx.pointOfInterest.findFirst({
      where: { id: input.poiId },
      select: poiDiscoveryEligibilitySelect,
    })
    if (!after) return { result, discoveryRevalidationPaths: discoveryPaths(before) }

    const eligibility = getPoiDiscoveryEligibility(after)
    if (eligibility.eligible && after.discovery_status === 'PUBLISHED') {
      return {
        result,
        discoveryRevalidationPaths: dedupePaths([
          ...discoveryPaths(before),
          ...discoveryPaths(after),
        ]),
      }
    }

    if (after.discovery_status !== 'PUBLISHED') {
      return { result, discoveryRevalidationPaths: discoveryPaths(before) }
    }

    const unpublished = await tx.pointOfInterest.update({
      where: { id: input.poiId },
      data: { discovery_status: 'DRAFT', discovery_published_at: null },
      select: { discovery_status: true, discovery_published_at: true },
    })
    await tx.poiAcquisitionAuditLog.create({
      data: {
        admin_id: input.auditActorId,
        action: 'poi_discovery_auto_unpublished',
        target_type: 'poi',
        target_id: input.poiId,
        before: publicationSnapshot(before, eligibility.missing, input.cause),
        after: {
          discovery_status: unpublished.discovery_status,
          discovery_published_at: unpublished.discovery_published_at?.toISOString() ?? null,
          missing: eligibility.missing,
          cause: input.cause,
        },
      },
    })

    return { result, discoveryRevalidationPaths: discoveryPaths(before) }
  })
}

function discoveryPaths(poi: PublishedPoiSnapshot): string[] {
  return [
    `/decouvrir/${poi.city.slug}`,
    `/decouvrir/${poi.city.slug}/${poi.category.slug}`,
    `/decouvrir/${poi.city.slug}/${poi.category.slug}/${poi.slug}`,
  ]
}

function dedupePaths(paths: string[]): string[] {
  return [...new Set(paths)]
}

function publicationSnapshot(
  poi: PublishedPoiSnapshot,
  missing: ReturnType<typeof getPoiDiscoveryEligibility>['missing'],
  cause: DiscoveryMutationCause,
): Prisma.InputJsonValue {
  return {
    discovery_status: poi.discovery_status,
    discovery_published_at: poi.discovery_published_at?.toISOString() ?? null,
    missing,
    cause,
  }
}
