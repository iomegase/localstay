// Spec 073 : acquisition guidée par les types Google (Places API, table des types).

/** Type exact ou motif `*_suffixe` (ex. `*_restaurant`). */
export function matchesGoogleType(type: string, accepted: string[]): boolean {
  return accepted.some(entry => (entry.startsWith('*') ? type.endsWith(entry.slice(1)) : type === entry))
}

/**
 * Spec 073 AC-03-01 : `primary` si le type principal est accepté, `secondary` si seul un
 * type secondaire l'est (ou aucun), `unknown` sans type principal. Sans types
 * configurés, aucun tri : tout est `primary`.
 */
export function classifyTypeMatch(
  primaryType: string | null,
  _types: string[],
  accepted: string[],
): 'primary' | 'secondary' | 'unknown' {
  if (accepted.length === 0) return 'primary'
  if (!primaryType) return 'unknown'
  return matchesGoogleType(primaryType, accepted) ? 'primary' : 'secondary'
}

export type TypeQuery = {
  includedType: string
  query_subcategory_name: string | null
}

/**
 * Spec 073 AC-02-01 / AC-02-02 / BR-02 : une requête par type exact distinct ; rattachée à
 * la sous-catégorie qui seule déclare ce type, sinon à la catégorie.
 */
export function planTypeQueries(input: {
  categoryTypes: string[]
  subcategories: Array<{ name: string; types: string[] }>
}): TypeQuery[] {
  const exact = (types: string[]) => types.filter(type => !type.includes('*'))
  const ordered = [...new Set([...exact(input.categoryTypes), ...input.subcategories.flatMap(sub => exact(sub.types))])]

  return ordered.map(type => {
    const owners = input.subcategories.filter(sub => sub.types.includes(type))
    const owner = owners.length === 1 ? owners[0]! : null
    return { includedType: type, query_subcategory_name: owner?.name ?? null }
  })
}

const LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  french_restaurant: 'Restaurant français',
  italian_restaurant: 'Restaurant italien',
  pizza_restaurant: 'Pizzeria',
  fast_food_restaurant: 'Restauration rapide',
  breakfast_restaurant: 'Petit-déjeuner',
  brunch_restaurant: 'Brunch',
  bistro: 'Bistrot',
  cafe: 'Café',
  coffee_shop: 'Coffee shop',
  tea_house: 'Salon de thé',
  bakery: 'Boulangerie',
  pastry_shop: 'Pâtisserie',
  bar: 'Bar',
  wine_bar: 'Bar à vin',
  pub: 'Pub',
  lounge_bar: 'Lounge',
  cocktail_bar: 'Bar à cocktails',
  hotel: 'Hôtel',
  lodging: 'Hébergement',
  store: 'Magasin',
  clothing_store: 'Vêtements',
  gift_shop: 'Boutique de souvenirs',
  grocery_store: 'Épicerie',
  food_store: 'Alimentation',
  market: 'Marché',
  book_store: 'Librairie',
  sporting_goods_store: 'Articles de sport',
  spa: 'Spa',
  massage: 'Massage',
  sauna: 'Sauna',
  museum: 'Musée',
  art_gallery: 'Galerie d’art',
  historical_landmark: 'Site historique',
  church: 'Église',
  library: 'Bibliothèque',
  tourist_attraction: 'Attraction touristique',
  ski_resort: 'Station de ski',
  swimming_pool: 'Piscine',
  park: 'Parc',
  playground: 'Aire de jeux',
  pharmacy: 'Pharmacie',
  doctor: 'Médecin',
  hospital: 'Hôpital',
  veterinary_care: 'Vétérinaire',
}

/** Spec 073 AC-03-03 : libellé français d'un type Google. */
export function googleTypeLabel(type: string | null): string {
  if (!type) return 'Type inconnu'
  return LABELS[type] ?? type.replace(/_/g, ' ')
}
