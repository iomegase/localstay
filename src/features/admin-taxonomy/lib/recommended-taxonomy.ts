import { prisma } from '@/shared/lib/prisma'

type TaxonomySeedClient = Pick<typeof prisma, 'category' | 'subCategory'>

export type RecommendedTaxonomyCategory = {
  name: string
  slug: string
  icon: string
  sort_order: number
  subcategories: Array<{
    name: string
    slug: string
    sort_order: number
  }>
}

export const RECOMMENDED_TAXONOMY: RecommendedTaxonomyCategory[] = [
  {
    name: 'Restaurant',
    slug: 'diner',
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
    icon: 'coffee',
    sort_order: 2,
    subcategories: [
      { name: 'Petit-déjeuner', slug: 'petit-dejeuner', sort_order: 1 },
      { name: 'Café', slug: 'cafe', sort_order: 2 },
      { name: 'Salon de thé', slug: 'salon-de-the', sort_order: 3 },
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
    icon: 'shopping-bag',
    sort_order: 5,
    subcategories: [
      { name: 'Boutiques locales', slug: 'boutiques-locales', sort_order: 1 },
      { name: 'Souvenirs', slug: 'souvenirs', sort_order: 2 },
      { name: 'Produits régionaux', slug: 'produits-regionaux', sort_order: 3 },
    ],
  },
  {
    name: 'Culture',
    slug: 'culture',
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
    icon: 'cross',
    sort_order: 11,
    subcategories: [
      { name: 'Pharmacie', slug: 'pharmacie', sort_order: 1 },
      { name: 'Médecin', slug: 'medecin', sort_order: 2 },
      { name: 'Vétérinaire', slug: 'veterinaire', sort_order: 3 },
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
          is_active: true,
          category_id: createdCategory.id,
        },
      })
    }
  }
}
