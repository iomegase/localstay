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

  // ── Seed categories ────────────────────────────────────────────────────────
  const categorySeed = [
    { name: 'Restaurants',  slug: 'restaurants', icon: 'utensils',      sort_order: 1 },
    { name: 'Randonnées',   slug: 'randonnees',  icon: 'mountain',      sort_order: 2 },
    { name: 'Bien-être',    slug: 'bien-etre',   icon: 'sparkles',      sort_order: 3 },
    { name: 'Shopping',     slug: 'shopping',    icon: 'shopping-bag',  sort_order: 4 },
    { name: 'Culture',      slug: 'culture',     icon: 'landmark',      sort_order: 5 },
  ]

  for (const cat of categorySeed) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, is_active: true },
    })
  }

  const restaurants = await prisma.category.findFirstOrThrow({
    where: { slug: 'restaurants' },
  })

  // ── Subcategories for "restaurants" (spec 002, AC-03-01/03-02 e2e filter) ─
  const subcatGastro = await prisma.subCategory.upsert({
    where: { slug: 'gastronomique' },
    update: {},
    create: {
      name: 'Gastronomique',
      slug: 'gastronomique',
      sort_order: 1,
      is_active: true,
      category_id: restaurants.id,
    },
  })

  const subcatSnacking = await prisma.subCategory.upsert({
    where: { slug: 'snacking' },
    update: {},
    create: {
      name: 'Snacking',
      slug: 'snacking',
      sort_order: 2,
      is_active: true,
      category_id: restaurants.id,
    },
  })

  // ── POI for restaurants/gastronomique ─────────────────────────────────────
  await prisma.pointOfInterest.upsert({
    where: { city_id_slug: { city_id: city.id, slug: 'restaurants-gastro-demo' } },
    update: {},
    create: {
      name: 'Le Bistrot du Mont-Blanc',
      slug: 'restaurants-gastro-demo',
      address: 'Place du Mont-Blanc, 74170 Saint-Gervais-les-Bains',
      latitude: 45.8921,
      longitude: 6.7085,
      is_active: true,
      city_id: city.id,
      category_id: restaurants.id,
      subcategory_id: subcatGastro.id,
    },
  })

  // ── POI for restaurants/snacking ──────────────────────────────────────────
  await prisma.pointOfInterest.upsert({
    where: { city_id_slug: { city_id: city.id, slug: 'restaurants-snacking-demo' } },
    update: {},
    create: {
      name: 'Café de la Vallée',
      slug: 'restaurants-snacking-demo',
      address: 'Rue de la Gare, 74170 Saint-Gervais-les-Bains',
      latitude: 45.8918,
      longitude: 6.7080,
      is_active: true,
      city_id: city.id,
      category_id: restaurants.id,
      subcategory_id: subcatSnacking.id,
    },
  })

  // ── One demo POI for each other category ─────────────────────────────────
  const otherCats = categorySeed.filter(c => c.slug !== 'restaurants')
  for (const cat of otherCats) {
    const category = await prisma.category.findFirstOrThrow({ where: { slug: cat.slug } })
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

  console.log('✓ Seed complete — Saint-Gervais-les-Bains: 5 categories, 2 subcategories, 6 POIs')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
