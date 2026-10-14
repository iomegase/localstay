import { prisma } from '@/shared/lib/prisma'
import { SEMINAR_ACTIVITY_CATALOG, type CatalogActivity } from '../lib/catalog'
import { seminarActivitySlug } from '../lib/slug'

/**
 * Spec 097 BR-14 : import idempotent (clé `slug`). Les activités absentes sont créées
 * non publiées, sans image, prix, prestataire ni attribution ; les existantes
 * (même supprimées) ne sont jamais modifiées.
 */
export async function importSeminarActivityCatalog(
  catalog: readonly CatalogActivity[] = SEMINAR_ACTIVITY_CATALOG,
  options: { dryRun?: boolean } = {},
): Promise<{ created: string[]; skipped: string[] }> {
  const slugs = catalog.map(activity => seminarActivitySlug(activity.title))
  if (new Set(slugs).size !== slugs.length) throw new Error('Catalogue : deux activités produisent le même slug')

  const existing = await prisma.seminarActivity.findMany({ where: { slug: { in: slugs } }, select: { slug: true } })
  const known = new Set(existing.map(row => row.slug))
  const missing = catalog.filter((_, index) => !known.has(slugs[index]!))

  if (!options.dryRun && missing.length) {
    await prisma.seminarActivity.createMany({
      data: missing.map(activity => ({ ...activity, slug: seminarActivitySlug(activity.title) })),
      skipDuplicates: true,
    })
  }
  return { created: missing.map(activity => activity.title), skipped: catalog.filter((_, index) => known.has(slugs[index]!)).map(activity => activity.title) }
}
