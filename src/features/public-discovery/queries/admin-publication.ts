import { Prisma, type PoiDiscoveryStatus } from '@prisma/client'
import { PoiAcquisitionError } from '@/features/poi-acquisition/lib/errors'
import { runSerializableTransaction } from '@/shared/lib/serializable-transaction'
import { getPoiDiscoveryEligibility } from '../lib/eligibility'

const eligibilityKeys = [
  'active',
  'city',
  'category',
  'subcategory',
  'description',
  'photo',
  'address',
  'geocode',
  'contact',
] as const

export type PoiDiscoveryEligibilityDto = {
  eligible: boolean
  checks: Record<(typeof eligibilityKeys)[number], boolean>
}

export type PoiDiscoveryPublicationDto = {
  id: string
  discovery_status: PoiDiscoveryStatus
  discovery_published_at: string | null
  public_url: string | null
  eligibility: PoiDiscoveryEligibilityDto
}

export type PoiDiscoveryPublicationResult = PoiDiscoveryPublicationDto & {
  invalidation_paths: string[]
}

export const poiDiscoveryEligibilitySelect = {
  id: true,
  slug: true,
  description: true,
  address: true,
  latitude: true,
  longitude: true,
  phone: true,
  website: true,
  photos: true,
  is_active: true,
  deleted_at: true,
  geocode_status: true,
  discovery_status: true,
  discovery_published_at: true,
  city: {
    select: { id: true, slug: true, is_active: true, deleted_at: true },
  },
  category: {
    select: { id: true, slug: true, is_active: true, deleted_at: true },
  },
  subcategory: {
    select: { id: true, slug: true, is_active: true, deleted_at: true },
  },
} satisfies Prisma.PointOfInterestSelect

type PoiDiscoveryRow = Prisma.PointOfInterestGetPayload<{
  select: typeof poiDiscoveryEligibilitySelect
}>

export async function updatePoiDiscoveryPublication(
  id: string,
  status: PoiDiscoveryStatus,
  adminId: string,
): Promise<PoiDiscoveryPublicationResult> {
  return runSerializableTransaction(async tx => {
    const before = await tx.pointOfInterest.findFirst({
      where: { id },
      select: poiDiscoveryEligibilitySelect,
    })
    if (!before) throw new PoiAcquisitionError('POI_NOT_FOUND', 404)

    const eligibility = getPoiDiscoveryEligibility(before)
    if (status === 'PUBLISHED' && !eligibility.eligible) {
      throw new PoiAcquisitionError('DISCOVERY_PUBLICATION_INCOMPLETE', 409, {
        missing: eligibility.missing,
      })
    }

    if (before.discovery_status === status) return mapPoiDiscoveryPublication(before)

    const publishedAt = status === 'PUBLISHED' ? new Date() : null
    const updated = await tx.pointOfInterest.update({
      where: { id },
      data: {
        discovery_status: status,
        discovery_published_at: publishedAt,
      },
      select: poiDiscoveryEligibilitySelect,
    })

    await tx.poiAcquisitionAuditLog.create({
      data: {
        admin_id: adminId,
        action: status === 'PUBLISHED'
          ? 'poi_discovery_published'
          : 'poi_discovery_unpublished',
        target_type: 'poi',
        target_id: id,
        before: publicationAuditSnapshot(before),
        after: publicationAuditSnapshot(updated),
      },
    })

    return mapPoiDiscoveryPublication(updated)
  })
}

export function mapPoiDiscoveryPublication(row: PoiDiscoveryRow): PoiDiscoveryPublicationResult {
  const eligibility = getPoiDiscoveryEligibility(row)
  const publicUrl = buildPoiDiscoveryPublicUrl(row)

  return {
    id: row.id,
    discovery_status: row.discovery_status,
    discovery_published_at: row.discovery_published_at?.toISOString() ?? null,
    public_url:
      row.discovery_status === 'PUBLISHED' && eligibility.eligible
        ? publicUrl
        : null,
    eligibility: toEligibilityDto(eligibility),
    invalidation_paths: [
      `/decouvrir/${row.city.slug}`,
      `/decouvrir/${row.city.slug}/${row.category.slug}`,
      publicUrl,
    ],
  }
}

export function toEligibilityDto(
  eligibility: ReturnType<typeof getPoiDiscoveryEligibility>,
): PoiDiscoveryEligibilityDto {
  const missing = new Set(eligibility.missing)
  return {
    eligible: eligibility.eligible,
    checks: Object.fromEntries(
      eligibilityKeys.map(key => [key, !missing.has(key)]),
    ) as PoiDiscoveryEligibilityDto['checks'],
  }
}

export function buildPoiDiscoveryPublicUrl(row: {
  slug: string
  city: { slug: string }
  category: { slug: string }
}): string {
  return `/decouvrir/${row.city.slug}/${row.category.slug}/${row.slug}`
}

function publicationAuditSnapshot(row: PoiDiscoveryRow): Prisma.InputJsonValue {
  return {
    discovery_status: row.discovery_status,
    discovery_published_at: row.discovery_published_at?.toISOString() ?? null,
  }
}
