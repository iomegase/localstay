/**
 * Spec 101 AC-02-06 — reprise : POI actifs sans photo → photos sous licence libre de Wikimedia
 * Commons, avec leurs crédits. Les POI qui ont déjà des photos ne sont jamais touchés (BR-02).
 * Dry-run par défaut ; `--apply` pour écrire.
 * Usage : npx tsx --env-file=.env scripts/backfill-commons-photos.ts [--apply]
 */
import { findCommonsPhotos } from '@/features/poi-photos/services/wikimedia-commons'
import { prisma } from '@/shared/lib/prisma'

async function main() {
  const apply = process.argv.includes('--apply')
  const pois = await prisma.pointOfInterest.findMany({
    where: { deleted_at: null, is_active: true, photos: { isEmpty: true } },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, latitude: true, longitude: true, city: { select: { name: true } } },
  })
  console.log(`${pois.length} POI actifs sans photo.`)

  let found = 0
  for (const poi of pois) {
    const photos = await findCommonsPhotos({ ...poi, city: poi.city.name })
    if (photos.length === 0) continue
    found += 1
    console.log(`  + ${poi.name} (${poi.city.name}) : ${photos.length} photo(s) — ${[...new Set(photos.map(photo => `${photo.author}, ${photo.license}`))].join(' · ')}`)
    if (apply) {
      // Revérifie au moment d'écrire : une photo ajoutée entre-temps n'est jamais remplacée.
      await prisma.pointOfInterest.updateMany({
        where: { id: poi.id, photos: { isEmpty: true } },
        data: { photos: photos.map(photo => photo.photo_url), photo_credits: photos },
      })
    }
  }
  console.log(`${found} POI avec des photos Commons.`)
  console.log(apply ? 'Appliqué.' : 'Dry-run : rien n’est écrit. Relancer avec --apply.')
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
