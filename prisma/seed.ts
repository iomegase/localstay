import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Enable unaccent extension for accent-insensitive city search (BR-06)
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS unaccent;`)

  // ── Pilot city (spec 001, OQ-02) ──────────────────────────────────────────
  const city = await prisma.city.upsert({
    where: { slug: 'saint-gervais-les-bains' },
    update: {},
    create: {
      name: 'Saint-Gervais-les-Bains',
      slug: 'saint-gervais-les-bains',
      postal_code: '74170',
      department: 'Haute-Savoie',
      region: 'Auvergne-Rhône-Alpes',
      latitude: 45.8921,
      longitude: 6.7085,
      is_active: true,
    },
  })

  // ── Seed categories + one active POI each so poi_count >= 1 ───────────────
  const categorySeed = [
    { name: 'Restaurants',  slug: 'restaurants', icon: 'utensils',   sort_order: 1 },
    { name: 'Randonnées',   slug: 'randonnees',  icon: 'mountain',   sort_order: 2 },
    { name: 'Bien-être',    slug: 'bien-etre',   icon: 'sparkles',   sort_order: 3 },
    { name: 'Shopping',     slug: 'shopping',    icon: 'shopping-bag', sort_order: 4 },
    { name: 'Culture',      slug: 'culture',     icon: 'landmark',   sort_order: 5 },
  ]

  for (const cat of categorySeed) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, is_active: true },
    })

    await prisma.pointOfInterest.upsert({
      where: { city_id_slug: { city_id: city.id, slug: `${cat.slug}-demo` } },
      update: {},
      create: {
        name: `Démo ${cat.name}`,
        slug: `${cat.slug}-demo`,
        address: 'Place du Mont-Blanc, 74170 Saint-Gervais-les-Bains',
        latitude: 45.8921,
        longitude: 6.7085,
        is_active: true,
        city_id: city.id,
        category_id: category.id,
      },
    })
  }

  console.log(
    '✓ Seed complete — Saint-Gervais-les-Bains with',
    categorySeed.length,
    'categories and',
    categorySeed.length,
    'demo POIs'
  )
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
