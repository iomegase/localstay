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

export function lodgingSlugCandidates(title: string, city: string): string[] {
  const base = lodgingProfileSlug(title)
  const citySlug = lodgingProfileSlug(city)
  const cityCandidate = lodgingProfileSlug(`${base}-${citySlug}`)

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

  const suffixBase = candidates[candidates.length - 1]
  let suffix = 2

  while (true) {
    const suffixText = String(suffix)
    const trimmedBase = suffixBase
      .slice(0, 80 - suffixText.length - 1)
      .replace(/-+$/g, '')
    const candidate = `${trimmedBase}-${suffixText}`

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
