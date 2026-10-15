import { prisma } from '@/shared/lib/prisma'
import { countWords } from '@/shared/lib/description-length'

/** Spec 098 AC-01-01 : seuil « description courte » (OQ-02, 120 mots). */
export const SHORT_DESCRIPTION_WORDS = 120

export type DescriptionEnrichmentItem = {
  id: string
  name: string
  city_name: string
  category_name: string
  word_count: number
  public_path: string
  description: string
}

/**
 * Spec 098 AC-01-01 : POI publiés (découverte), actifs, non supprimés, dont la
 * description fait moins de 120 mots, du plus court au plus long.
 */
export async function listDescriptionEnrichmentItems(): Promise<DescriptionEnrichmentItem[]> {
  const rows = await prisma.pointOfInterest.findMany({
    where: { deleted_at: null, is_active: true, discovery_status: 'PUBLISHED' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      city: { select: { name: true, slug: true } },
      category: { select: { name: true, slug: true } },
    },
  })
  return rows
    .map(row => ({
      id: row.id,
      name: row.name,
      city_name: row.city.name,
      category_name: row.category.name,
      word_count: countWords(row.description ?? ''),
      public_path: `/decouvrir/${row.city.slug}/${row.category.slug}/${row.slug}`,
      description: row.description ?? '',
    }))
    .filter(item => item.word_count < SHORT_DESCRIPTION_WORDS)
    .sort((a, b) => a.word_count - b.word_count || a.name.localeCompare(b.name, 'fr'))
}
