/**
 * Spec 019 BR-22 — reprise : randonnées publiées sans sous-catégorie → Facile / Moyen / Difficile
 * d'après la difficulté du TrailDetail. Ne touche jamais une sous-catégorie déjà choisie par l'admin.
 * Dry-run par défaut ; `--apply` pour écrire.
 * Usage : npx tsx --env-file=.env scripts/backfill-trail-subcategories.ts [--apply]
 */
import { trailDifficultySubcategorySlug } from '@/features/trails-acquisition/lib/difficulty'
import { prisma } from '@/shared/lib/prisma'

async function main() {
  const apply = process.argv.includes('--apply')
  const rando = await prisma.category.findFirst({
    where: { slug: 'rando', is_active: true, deleted_at: null },
    select: { id: true, subcategories: { where: { is_active: true, deleted_at: null }, select: { id: true, slug: true, name: true } } },
  })
  if (!rando) throw new Error('Catégorie Rando introuvable')

  const pois = await prisma.pointOfInterest.findMany({
    where: { category_id: rando.id, subcategory_id: null, deleted_at: null, trail_detail: { isNot: null } },
    select: { id: true, name: true, trail_detail: { select: { difficulty: true } } },
    orderBy: { name: 'asc' },
  })

  let updates = 0
  for (const poi of pois) {
    const slug = trailDifficultySubcategorySlug(poi.trail_detail?.difficulty)
    const subcategory = rando.subcategories.find(sub => sub.slug === slug)
    if (!subcategory) {
      console.log(`  · ${poi.name} : difficulté « ${poi.trail_detail?.difficulty ?? '—'} » → aucune sous-catégorie`)
      continue
    }
    updates += 1
    console.log(`  + ${poi.name} : ${poi.trail_detail?.difficulty} → ${subcategory.name}`)
    if (apply) {
      await prisma.pointOfInterest.update({ where: { id: poi.id }, data: { subcategory_id: subcategory.id } })
    }
  }

  console.log(`\n${updates} / ${pois.length} randonnée(s) ${apply ? 'mises à jour' : 'à mettre à jour (dry-run, --apply pour écrire)'}.`)
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
