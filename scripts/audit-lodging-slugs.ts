import { prisma } from '@/shared/lib/prisma'
import {
  findLodgingSlugCollisions,
  type AuditedLodgingSlug,
} from '@/features/lodging-showcase/lib/slug'

async function main(): Promise<void> {
  try {
    const profiles = await prisma.lodgingPublicProfile.findMany({
      select: {
        id: true,
        slug: true,
        deleted_at: true,
        city: { select: { slug: true } },
      },
    })

    const auditedProfiles: AuditedLodgingSlug[] = profiles.map((profile) => ({
      id: profile.id,
      slug: profile.slug,
      citySlug: profile.city.slug,
      deletedAt: profile.deleted_at?.toISOString() ?? null,
    }))
    const collisions = findLodgingSlugCollisions(auditedProfiles)

    console.log(`Audited lodging public profile slugs: ${auditedProfiles.length}`)
    console.log(`Global slug collisions: ${collisions.length}`)

    for (const collision of collisions) {
      const profilesSummary = collision.profiles
        .map((profile) => {
          const deletedMarker = profile.deletedAt === null ? '' : ', soft-deleted'
          return `${profile.id} (${profile.citySlug}${deletedMarker})`
        })
        .join(', ')
      console.log(`- ${collision.slug}: ${profilesSummary}`)
    }

    if (collisions.length > 0) {
      process.exitCode = 1
    }
  } finally {
    await prisma.$disconnect()
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown audit error'
  console.error(`Lodging slug audit failed: ${message}`)
  process.exitCode = 1
})
