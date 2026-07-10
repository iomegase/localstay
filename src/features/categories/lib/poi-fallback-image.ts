const FALLBACK_BY_KIND = {
  alimentation: '/fallback/fallback-alimentation.png',
  bar: '/fallback/fallback-bar.png',
  boulangerie: '/fallback/fallback-boulangerie.png',
  cafe: '/fallback/fallback-cafe.png',
  concert: '/fallback/fallback-concert.png',
  culture: '/fallback/fallback-culture.png',
  famille: '/fallback/fallback-famille.png',
  locationDeSki: '/fallback/fallback-location-de-ski.png',
  piscine: '/fallback/fallback-piscine.png',
  rando: '/fallback/fallback-rando.png',
  restaurant: '/fallback/fallback-restaurant.png',
  shopping: '/fallback/fallback-shopping.png',
  transport: '/fallback/fallback-transport.png',
  urgence: '/fallback/fallback-urgence.png',
} as const

type FallbackKind = keyof typeof FALLBACK_BY_KIND

const MATCHERS: Array<{ kind: FallbackKind; patterns: string[] }> = [
  { kind: 'locationDeSki', patterns: ['location-de-ski', 'location-ski', 'ski-rental', 'skiset'] },
  { kind: 'restaurant', patterns: ['restaurant', 'restaurants', 'resto', 'diner', 'gastronomique'] },
  { kind: 'rando', patterns: ['rando', 'randonnee', 'randonnée', 'hiking', 'trail', 'sentier'] },
  { kind: 'boulangerie', patterns: ['boulangerie', 'boulangeries', 'bakery'] },
  { kind: 'alimentation', patterns: ['alimentation', 'epicerie', 'épicerie', 'marche', 'marché', 'fromagerie', 'traiteur'] },
  { kind: 'cafe', patterns: ['cafe', 'café', 'coffee', 'salon-de-the', 'salon-de-thé'] },
  { kind: 'bar', patterns: ['bar', 'pub', 'brasserie'] },
  { kind: 'concert', patterns: ['concert', 'concerts', 'musique', 'festival', 'spectacle'] },
  { kind: 'shopping', patterns: ['shopping', 'boutique', 'boutiques', 'commerce', 'commerces', 'shop'] },
  { kind: 'culture', patterns: ['culture', 'musee', 'musée', 'patrimoine', 'cinema', 'cinéma', 'expo', 'galerie'] },
  { kind: 'famille', patterns: ['famille', 'enfant', 'enfants', 'kids', 'loisirs'] },
  { kind: 'piscine', patterns: ['piscine', 'baignade', 'aquatique'] },
  { kind: 'transport', patterns: ['transport', 'transports', 'mobilite', 'mobilité', 'navette', 'bus', 'train'] },
  { kind: 'urgence', patterns: ['urgence', 'urgences', 'pharmacie', 'medical', 'médical', 'sante', 'santé'] },
]

export function getPoiFallbackImage(
  categorySlug: string | null | undefined,
  subcategorySlugOrName: string | null | undefined,
): string | null {
  const candidates = [subcategorySlugOrName, categorySlug].map(normalizeToken).filter(Boolean)

  for (const candidate of candidates) {
    const match = MATCHERS.find(({ patterns }) => patterns.some(pattern => candidate.includes(normalizeToken(pattern))))
    if (match) return FALLBACK_BY_KIND[match.kind]
  }

  return null
}

function normalizeToken(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
