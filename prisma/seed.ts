import { Prisma, PrismaClient } from '@prisma/client'

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
    update: {
      phone: '+33 4 50 78 24 90',
      website: 'https://bistrot-mont-blanc.fr',
      description: 'Cuisine du terroir savoyard avec vue sur le Mont-Blanc. Le chef revisite les classiques avec des produits locaux de saison.',
      rating: 4.5,
      rating_count: 120,
      is_open_now: true,
      photos: [
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
        'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
      ],
      hours: {
        '0': null,
        '1': { open: '12:00', close: '14:30' },
        '2': { open: '12:00', close: '14:30' },
        '3': { open: '12:00', close: '14:30' },
        '4': { open: '12:00', close: '14:30' },
        '5': { open: '12:00', close: '14:30' },
        '6': { open: '19:00', close: '22:30' },
      },
    },
    create: {
      name: 'Le Bistrot du Mont-Blanc',
      slug: 'restaurants-gastro-demo',
      address: 'Place du Mont-Blanc, 74170 Saint-Gervais-les-Bains',
      latitude: 45.8921,
      longitude: 6.7085,
      phone: '+33 4 50 78 24 90',
      website: 'https://bistrot-mont-blanc.fr',
      description: 'Cuisine du terroir savoyard avec vue sur le Mont-Blanc. Le chef revisite les classiques avec des produits locaux de saison.',
      rating: 4.5,
      rating_count: 120,
      is_open_now: true,
      photos: [
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
        'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
      ],
      hours: {
        '0': null,
        '1': { open: '12:00', close: '14:30' },
        '2': { open: '12:00', close: '14:30' },
        '3': { open: '12:00', close: '14:30' },
        '4': { open: '12:00', close: '14:30' },
        '5': { open: '12:00', close: '14:30' },
        '6': { open: '19:00', close: '22:30' },
      },
      is_active: true,
      city_id: city.id,
      category_id: restaurants.id,
      subcategory_id: subcatGastro.id,
    },
  })

  await prisma.pointOfInterest.upsert({
    where: { city_id_slug: { city_id: city.id, slug: 'brasserie-du-mont-blanc' } },
    update: {
      name: 'Brasserie du Mont Blanc',
      address: '31 Avenue du Mont Paccard, 74170 Saint-Gervais-les-Bains',
      latitude: 45.892331,
      longitude: 6.711156,
      description: "Brasserie conviviale au coeur de Saint-Gervais, avec une cuisine de brasserie et des spécialités de montagne.",
      is_active: true,
      deleted_at: null,
      geocode_status: 'success',
      geocode_provider: 'mapbox',
      geocoded_at: new Date('2026-05-24T00:00:00.000Z'),
    },
    create: {
      name: 'Brasserie du Mont Blanc',
      slug: 'brasserie-du-mont-blanc',
      address: '31 Avenue du Mont Paccard, 74170 Saint-Gervais-les-Bains',
      latitude: 45.892331,
      longitude: 6.711156,
      phone: null,
      website: null,
      description: "Brasserie conviviale au coeur de Saint-Gervais, avec une cuisine de brasserie et des spécialités de montagne.",
      rating: null,
      rating_count: 0,
      is_open_now: null,
      photos: [],
      tags: [],
      hours: Prisma.JsonNull,
      is_active: true,
      geocode_status: 'success',
      geocode_provider: 'mapbox',
      geocoded_at: new Date('2026-05-24T00:00:00.000Z'),
      city_id: city.id,
      category_id: restaurants.id,
      subcategory_id: subcatGastro.id,
    },
  })

  // ── POI for restaurants/snacking ──────────────────────────────────────────
  await prisma.pointOfInterest.upsert({
    where: { city_id_slug: { city_id: city.id, slug: 'restaurants-snacking-demo' } },
    update: {
      rating: 3.8,
      rating_count: 45,
      is_open_now: false,
      photos: ['https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400'],
    },
    create: {
      name: 'Café de la Vallée',
      slug: 'restaurants-snacking-demo',
      address: 'Rue de la Gare, 74170 Saint-Gervais-les-Bains',
      latitude: 45.8918,
      longitude: 6.7080,
      rating: 3.8,
      rating_count: 45,
      is_open_now: false,
      photos: ['https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400'],
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

  // ── Enrich randonnées-demo → Lac Blanc (with HikingDetail) ──────────────────
  const randonnees = await prisma.category.findFirstOrThrow({ where: { slug: 'randonnees' } })

  const subcatHiking = await prisma.subCategory.upsert({
    where: { slug: 'randonnee-alpine' },
    update: {},
    create: {
      name: 'Randonnée Alpine',
      slug: 'randonnee-alpine',
      sort_order: 1,
      is_active: true,
      category_id: randonnees.id,
    },
  })

  const lacBlanc = await prisma.pointOfInterest.upsert({
    where: { city_id_slug: { city_id: city.id, slug: 'randonnees-demo' } },
    update: {
      name: 'Lac Blanc',
      description: 'Une randonnée alpine emblématique face au massif du Mont-Blanc, entre balcon naturel, panorama spectaculaire et ambiance haute montagne.',
      rating: 4.8,
      rating_count: 312,
      is_open_now: true,
      photos: [
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
        'https://images.unsplash.com/photo-1434394354979-a235cd36269d?w=800',
      ],
      subcategory_id: subcatHiking.id,
    },
    create: {
      name: 'Lac Blanc',
      slug: 'randonnees-demo',
      address: 'Parking de la Flégère, 74400 Chamonix-Mont-Blanc',
      latitude: 45.9464,
      longitude: 6.8709,
      description: 'Une randonnée alpine emblématique face au massif du Mont-Blanc, entre balcon naturel, panorama spectaculaire et ambiance haute montagne.',
      rating: 4.8,
      rating_count: 312,
      is_open_now: true,
      photos: [
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
        'https://images.unsplash.com/photo-1434394354979-a235cd36269d?w=800',
      ],
      is_active: true,
      city_id: city.id,
      category_id: randonnees.id,
      subcategory_id: subcatHiking.id,
    },
  })

  await prisma.hikingDetail.upsert({
    where: { poi_id: lacBlanc.id },
    update: {},
    create: {
      poi_id: lacBlanc.id,
      difficulty: 'hard',
      duration_minutes: 270,
      distance_km: 11.0,
      elevation_gain_m: 650,
      starting_point: 'Parking de la Flégère, 74400 Chamonix-Mont-Blanc',
      parking_info: 'Parking de la Flégère, payant en saison (env. 8€/jour)',
      kids_friendly: false,
      pets_friendly: true,
      best_season: ['summer'],
      gpx_url: null,
    },
  })

  console.log('✓ Seed complete — Saint-Gervais-les-Bains: 5 categories, 3 subcategories, 6 POIs (bistrot enriched, Lac Blanc with HikingDetail)')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
