export type AuditedLodgingSlug = {
  id: string
  slug: string
  citySlug: string
  deletedAt?: string | null
}

export type LodgingSlugCollision = {
  slug: string
  profiles: AuditedLodgingSlug[]
}

export function lodgingProfileSlug(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'logement'
}

const MAX_LODGING_SLUG_LENGTH = 80

function appendReadableSlugSuffix(
  base: string,
  suffixParts: readonly string[],
): string {
  const suffix = `-${suffixParts.join('-')}`
  const maximumBaseLength = MAX_LODGING_SLUG_LENGTH - suffix.length

  if (maximumBaseLength < 1) {
    throw new RangeError('The complete lodging slug suffix cannot fit within 80 characters.')
  }

  const truncatedBase = base
    .slice(0, maximumBaseLength)
    .replace(/-+$/g, '')

  if (!truncatedBase) {
    throw new RangeError('The lodging slug requires a readable title prefix.')
  }

  return `${truncatedBase}${suffix}`
}

export function lodgingSlugCandidates(title: string, city: string): string[] {
  const base = lodgingProfileSlug(title)
  const citySlug = lodgingProfileSlug(city)
  const cityCandidate = appendReadableSlugSuffix(base, [citySlug])

  return [...new Set([base, cityCandidate])]
}

export async function allocateLodgingSlug(
  title: string,
  city: string,
  isTaken: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const candidates = lodgingSlugCandidates(title, city)

  for (const candidate of candidates) {
    if (!(await isTaken(candidate))) return candidate
  }

  const base = lodgingProfileSlug(title)
  const citySlug = lodgingProfileSlug(city)
  let suffix = 2

  while (true) {
    const candidate = appendReadableSlugSuffix(base, [citySlug, String(suffix)])

    if (!(await isTaken(candidate))) return candidate
    suffix += 1
  }
}

export function findLodgingSlugCollisions(
  rows: readonly AuditedLodgingSlug[],
): LodgingSlugCollision[] {
  const grouped = new Map<string, AuditedLodgingSlug[]>()

  for (const row of rows) {
    const profiles = grouped.get(row.slug) ?? []
    profiles.push({ ...row })
    grouped.set(row.slug, profiles)
  }

  return [...grouped.entries()]
    .filter(([, profiles]) => profiles.length > 1)
    .sort(([slugA], [slugB]) => slugA < slugB ? -1 : slugA > slugB ? 1 : 0)
    .map(([slug, profiles]) => ({
      slug,
      profiles: profiles.sort((profileA, profileB) =>
        profileA.id < profileB.id ? -1 : profileA.id > profileB.id ? 1 : 0,
      ),
    }))
}
