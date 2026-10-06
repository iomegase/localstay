import { prisma } from '@/shared/lib/prisma'

type TaxonomySeedClient = Pick<typeof prisma, 'category' | 'subCategory'>

export type RecommendedTaxonomyCategory = {
  name: string
  slug: string
  icon: string
  sort_order: number
  /** Spec 073 : types Google acceptés. */
  google_types?: string[]
  subcategories: Array<{
    name: string
    slug: string
    sort_order: number
    google_types?: string[]
  }>
}

export const RECOMMENDED_TAXONOMY: RecommendedTaxonomyCategory[] = [
  {
    name: 'Restaurant',
    slug: 'diner',
    google_types: ['restaurant', '*_restaurant', 'bistro'],
    icon: 'utensils',
    sort_order: 1,
    subcategories: [
      { name: 'Restaurants', slug: 'restaurants', sort_order: 1 },
      { name: 'Gastronomie locale', slug: 'gastronomie-locale', sort_order: 2 },
      { name: 'Ouvert maintenant', slug: 'ouvert-maintenant', sort_order: 3 },
      { name: "Recommandé par l'hôte", slug: 'recommande-par-hote', sort_order: 4 },
    ],
  },
  {
    name: 'Cafés',
    slug: 'cafes',
    google_types: ['cafe', 'coffee_shop', 'tea_house', 'bakery', 'pastry_shop', 'breakfast_restaurant', 'brunch_restaurant'],
    icon: 'coffee',
    sort_order: 2,
    subcategories: [
      { name: 'Petit-déjeuner', slug: 'petit-dejeuner', sort_order: 1, google_types: ['breakfast_restaurant', 'brunch_restaurant', 'bakery'] },
      { name: 'Café', slug: 'cafe', sort_order: 2, google_types: ['cafe', 'coffee_shop'] },
      { name: 'Salon de thé', slug: 'salon-de-the', sort_order: 3, google_types: ['tea_house', 'pastry_shop'] },
    ],
  },
  {
    name: 'Rando',
    slug: 'rando',
    icon: 'mountain',
    sort_order: 3,
    subcategories: [
      { name: 'Toutes', slug: 'toutes', sort_order: 1 },
      { name: 'Facile', slug: 'facile', sort_order: 2 },
      { name: 'Moyen', slug: 'moyen', sort_order: 3 },
      { name: 'Difficile', slug: 'difficile', sort_order: 4 },
    ],
  },
  {
    name: 'Soin',
    slug: 'soin',
    google_types: ['spa', 'massage', 'sauna'],
    icon: 'sparkles',
    sort_order: 4,
    subcategories: [
      { name: 'Spa', slug: 'spa', sort_order: 1 },
      { name: 'Massage', slug: 'massage', sort_order: 2 },
      { name: 'Bien-être', slug: 'bien-etre', sort_order: 3 },
    ],
  },
  {
    name: 'Shopping',
    slug: 'shopping',
    google_types: ['store', 'clothing_store', 'gift_shop', 'grocery_store', 'food_store', 'market', 'book_store', 'sporting_goods_store'],
    icon: 'shopping-bag',
    sort_order: 5,
    subcategories: [
      { name: 'Boutiques locales', slug: 'boutiques-locales', sort_order: 1 },
      { name: 'Souvenirs', slug: 'souvenirs', sort_order: 2, google_types: ['gift_shop'] },
      { name: 'Produits régionaux', slug: 'produits-regionaux', sort_order: 3, google_types: ['grocery_store', 'food_store', 'market'] },
      { name: 'Location de ski', slug: 'location-de-ski', sort_order: 4, google_types: ['sporting_goods_store'] },
    ],
  },
  {
    name: 'Culture',
    slug: 'culture',
    google_types: ['museum', 'art_gallery', 'historical_landmark', 'church', 'library'],
    icon: 'landmark',
    sort_order: 6,
    subcategories: [
      { name: 'Patrimoine', slug: 'patrimoine', sort_order: 1 },
      { name: 'Musées', slug: 'musees', sort_order: 2 },
      { name: 'Monuments', slug: 'monuments', sort_order: 3 },
    ],
  },
  {
    name: 'Loisirs',
    slug: 'loisirs',
    google_types: ['tourist_attraction', 'amusement_center', 'bowling_alley', 'ski_resort', 'swimming_pool', 'movie_theater'],
    icon: 'bike',
    sort_order: 7,
    subcategories: [
      { name: 'Activités outdoor', slug: 'activites-outdoor', sort_order: 1 },
      { name: 'Activités indoor', slug: 'activites-indoor', sort_order: 2 },
      { name: 'Expériences locales', slug: 'experiences-locales', sort_order: 3 },
    ],
  },
  {
    name: 'Bars',
    slug: 'bars',
    google_types: ['bar', 'wine_bar', 'pub', 'lounge_bar', 'cocktail_bar'],
    icon: 'wine',
    sort_order: 8,
    subcategories: [
      { name: 'Apéritif', slug: 'aperitif', sort_order: 1 },
      { name: 'Bar à vin', slug: 'bar-a-vin', sort_order: 2 },
      { name: 'Sorties', slug: 'sorties', sort_order: 3 },
    ],
  },
  {
    name: 'Mobilité',
    slug: 'mobilite',
    google_types: ['taxi_stand', 'parking', 'train_station', 'bus_station', 'car_rental'],
    icon: 'car',
    sort_order: 9,
    subcategories: [
      { name: 'Taxi', slug: 'taxi', sort_order: 1 },
      { name: 'Navettes', slug: 'navettes', sort_order: 2 },
      { name: 'Parking', slug: 'parking', sort_order: 3 },
      { name: 'Gare / transport', slug: 'gare-transport', sort_order: 4 },
    ],
  },
  {
    name: 'Famille',
    slug: 'famille',
    google_types: ['playground', 'park', 'amusement_park', 'zoo', 'swimming_pool'],
    icon: 'baby',
    sort_order: 10,
    subcategories: [
      { name: 'Activités enfants', slug: 'activites-enfants', sort_order: 1 },
      { name: 'Balades faciles', slug: 'balades-faciles', sort_order: 2 },
      { name: 'Lieux adaptés famille', slug: 'lieux-adaptes-famille', sort_order: 3 },
    ],
  },
  {
    name: 'Urgences',
    slug: 'urgences',
    google_types: ['pharmacy', 'doctor', 'hospital', 'veterinary_care'],
    icon: 'cross',
    sort_order: 11,
    subcategories: [
      { name: 'Pharmacie', slug: 'pharmacie', sort_order: 1, google_types: ['pharmacy'] },
      { name: 'Médecin', slug: 'medecin', sort_order: 2, google_types: ['doctor'] },
      { name: 'Vétérinaire', slug: 'veterinaire', sort_order: 3, google_types: ['veterinary_care'] },
      { name: 'Numéros utiles', slug: 'numeros-utiles', sort_order: 4 },
    ],
  },
]

export async function seedRecommendedTaxonomy(client: TaxonomySeedClient = prisma): Promise<void> {
  for (const category of RECOMMENDED_TAXONOMY) {
    const createdCategory = await client.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        sort_order: category.sort_order,
        google_types: category.google_types ?? [],
        is_active: true,
      },
    })

    for (const subcategory of category.subcategories) {
      await client.subCategory.upsert({
        where: { slug: subcategory.slug },
        update: {},
        create: {
          name: subcategory.name,
          slug: subcategory.slug,
          sort_order: subcategory.sort_order,
          google_types: subcategory.google_types ?? [],
          is_active: true,
          category_id: createdCategory.id,
        },
      })
    }
  }
}
