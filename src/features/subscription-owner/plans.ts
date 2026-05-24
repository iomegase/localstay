export type OwnerPlanSlug = 'discovery' | 'basic' | 'pro' | 'concierge'

export type OwnerPlanDisplay = {
  slug: OwnerPlanSlug
  name: string
  price_label: string
  price_disclaimer: 'indicative_non_contractual'
  features: string[]
}

export const OWNER_PLAN_CATALOG: OwnerPlanDisplay[] = [
  {
    slug: 'discovery',
    name: 'Découverte',
    price_label: 'Gratuit',
    price_disclaimer: 'indicative_non_contractual',
    features: [
      'Guide public personnalisé',
      'QR code logement',
      'Sélection de POI recommandés',
    ],
  },
  {
    slug: 'basic',
    name: 'Basic',
    price_label: '9-19€/logement',
    price_disclaimer: 'indicative_non_contractual',
    features: [
      'Tout Découverte',
      'Statistiques essentielles',
      'Personnalisation avancée du guide',
    ],
  },
  {
    slug: 'pro',
    name: 'Pro',
    price_label: '29-49€/logement',
    price_disclaimer: 'indicative_non_contractual',
    features: [
      'Tout Basic',
      'Plusieurs logements',
      'Analytics détaillées',
      'Priorisation support',
    ],
  },
  {
    slug: 'concierge',
    name: 'Conciergerie',
    price_label: '99-299€',
    price_disclaimer: 'indicative_non_contractual',
    features: [
      'Tout Pro',
      'Accompagnement éditorial',
      'Configuration personnalisée',
      'Support premium',
    ],
  },
]

export function normalizeOwnerPlanSlug(plan: string): OwnerPlanSlug {
  if (plan === 'basic' || plan === 'pro' || plan === 'concierge') return plan
  return 'discovery'
}

export function getOwnerPlanFeatures(plan: string): string[] {
  const slug = normalizeOwnerPlanSlug(plan)
  return OWNER_PLAN_CATALOG.find((candidate) => candidate.slug === slug)?.features ?? OWNER_PLAN_CATALOG[0].features
}
