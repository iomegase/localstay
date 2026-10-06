// Restauration des données de référence après la réinitialisation de la base du
// 2026-10-06 : villes actives, taxonomie et pages locales (conciergerie / séminaire).
// Idempotent : n'écrase rien d'existant (upsert sur slug).
// Usage : npx tsx --env-file=.env.local scripts/restore-reference-data.ts
import { PrismaClient } from '@prisma/client'
import { seedRecommendedTaxonomy } from '../src/features/admin-taxonomy/lib/recommended-taxonomy'
import { buildLocalLandingBackfill } from '../prisma/backfill-local-landing-destinations'

const prisma = new PrismaClient()

// État relevé en base le 2026-10-06 avant l'incident (centre des Contamines corrigé, spec 066).
const CITIES = [
  { slug: 'saint-gervais-les-bains', name: 'Saint-Gervais-les-Bains', postal_code: '74170', insee_code: '74236', latitude: 45.89227, longitude: 6.712007 },
  { slug: 'saint-nicolas-de-veroce', name: 'Saint-Nicolas-de-Véroce', postal_code: '74170', insee_code: null, latitude: 45.863934, longitude: 6.717467 },
  { slug: 'les-contamines-montjoie', name: 'Les Contamines-Montjoie', postal_code: '74170', insee_code: '74085', latitude: 45.8214, longitude: 6.7272 },
  { slug: 'combloux', name: 'Combloux', postal_code: '74920', insee_code: '74083', latitude: 45.894476, longitude: 6.645167 },
  { slug: 'megeve', name: 'Megève', postal_code: '74120', insee_code: '74173', latitude: 45.838126, longitude: 6.572605 },
]

async function main() {
  await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS unaccent;')

  for (const city of CITIES) {
    await prisma.city.upsert({
      where: { slug: city.slug },
      update: {},
      create: { ...city, department: 'Haute-Savoie', region: 'Auvergne-Rhône-Alpes', is_active: true },
    })
  }
  console.log('Villes :', await prisma.city.count({ where: { deleted_at: null } }))

  await seedRecommendedTaxonomy(prisma)
  const shopping = await prisma.category.findUniqueOrThrow({ where: { slug: 'shopping' }, select: { id: true } })
  await prisma.subCategory.upsert({
    where: { slug: 'location-de-ski' },
    update: {},
    create: { name: 'Location de ski', slug: 'location-de-ski', sort_order: 4, category_id: shopping.id },
  })
  console.log('Catégories :', await prisma.category.count(), '| sous-catégories :', await prisma.subCategory.count())

  // Pages conciergerie / séminaire (spec 048) depuis le contenu figé du dépôt. Reprend la
  // logique d'écriture de prisma/backfill-local-landing-destinations.ts, sans l'étape de
  // rattachement des avis propre à l'ancienne migration (aucun avis à rattacher).
  for (const source of buildLocalLandingBackfill()) {
    const city = await prisma.city.findUniqueOrThrow({ where: { slug: source.slug }, select: { id: true } })
    const destination = await prisma.localLandingDestination.upsert({
      where: { city_id: city.id },
      update: {},
      create: { city_id: city.id, is_active: source.is_active },
      select: { id: true },
    })
    for (const page of source.pages) {
      await prisma.localLandingPage.upsert({
        where: { destination_id_intent: { destination_id: destination.id, intent: page.intent } },
        update: {},
        create: { destination_id: destination.id, ...page },
      })
    }
  }
  console.log(
    'Destinations :', await prisma.localLandingDestination.count(),
    '| actives :', await prisma.localLandingDestination.count({ where: { is_active: true } }),
    '| pages :', await prisma.localLandingPage.count(),
  )
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
