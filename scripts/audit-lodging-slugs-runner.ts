import {
  findLodgingSlugCollisions,
  type AuditedLodgingSlug,
} from '@/features/lodging-showcase/lib/slug'

export type LodgingSlugAuditPrismaProfile = {
  id: string
  slug: string
  deleted_at: Date | null
  city: { slug: string }
}

export type LodgingSlugAuditFindManyArgs = {
  select: {
    id: true
    slug: true
    deleted_at: true
    city: { select: { slug: true } }
  }
}

export type LodgingSlugAuditPrismaClient = {
  lodgingPublicProfile: {
    findMany: (
      args: LodgingSlugAuditFindManyArgs,
    ) => Promise<readonly LodgingSlugAuditPrismaProfile[]>
  }
}

export type LodgingSlugAuditDependencies = {
  readProfiles: () => Promise<readonly AuditedLodgingSlug[]>
  disconnect: () => Promise<void>
  writeLine: (line: string) => void
}

const lodgingSlugAuditSelect: LodgingSlugAuditFindManyArgs['select'] = {
  id: true,
  slug: true,
  deleted_at: true,
  city: { select: { slug: true } },
}

export function createPrismaLodgingSlugReader(
  prisma: LodgingSlugAuditPrismaClient,
): () => Promise<readonly AuditedLodgingSlug[]> {
  return async () => {
    const profiles = await prisma.lodgingPublicProfile.findMany({
      select: lodgingSlugAuditSelect,
    })

    return profiles.map((profile) => ({
      id: profile.id,
      slug: profile.slug,
      citySlug: profile.city.slug,
      deletedAt: profile.deleted_at?.toISOString() ?? null,
    }))
  }
}

export async function runLodgingSlugAudit(
  dependencies: LodgingSlugAuditDependencies,
): Promise<number> {
  let exitCode = 0

  try {
    try {
      const profiles = await dependencies.readProfiles()
      const collisions = findLodgingSlugCollisions(profiles)

      try {
        dependencies.writeLine(`Audited lodging public profile slugs: ${profiles.length}`)
        dependencies.writeLine(`Global slug collisions: ${collisions.length}`)

        for (const collision of collisions) {
          const profilesSummary = collision.profiles
            .map((profile) => {
              const deletedMarker = profile.deletedAt === null ? '' : ', soft-deleted'
              return `${profile.id} (${profile.citySlug}${deletedMarker})`
            })
            .join(', ')
          dependencies.writeLine(`- ${collision.slug}: ${profilesSummary}`)
        }
      } catch {
        dependencies.writeLine('Lodging slug audit failed while writing output.')
        exitCode = 1
      }

      if (collisions.length > 0) {
        exitCode = 1
      }
    } catch {
      dependencies.writeLine('Lodging slug audit failed while reading profiles.')
      exitCode = 1
    }
  } catch {
    // A failing diagnostic sink is surfaced after the lifecycle cleanup runs.
    exitCode = 1
  } finally {
    try {
      await dependencies.disconnect()
    } catch {
      dependencies.writeLine('Lodging slug audit failed while disconnecting Prisma.')
      exitCode = 1
    }
  }

  return exitCode
}
