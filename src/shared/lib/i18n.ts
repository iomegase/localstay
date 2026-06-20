const fr = {
  'home.title': "Trouvez ce qu'il vous faut.",
  'home.intro':
    'Choisissez votre destination et explorez les meilleures adresses locales, sélectionnées pour votre séjour.',
  'home.select.placeholder': 'Sélectionner une ville',
  'home.empty': 'Aucune catégorie disponible pour cette ville pour le moment.',
  'home.error': 'Impossible de charger les catégories. Réessayez.',
  'home.explore.heading': 'Nos destinations',
  'home.explore.lead':
    'MyStay réunit les meilleures adresses, randonnées et activités locales, ville par ville : restaurants, commerces, sentiers et bons plans sélectionnés sur place. Choisissez votre destination pour explorer le guide.',
  'guide.empty_state': 'Aucun contenu disponible pour cette ville pour le moment',
  'guide.error': 'Une erreur est survenue. Veuillez réessayer.',
  'guide.city_not_found': 'Ville introuvable',
  'guide.back_home': "Retour à l'accueil",
  'guide.subtitle': 'Sélection exclusive de votre hôte',
  'nav.explore': 'Bienvenue',
  'nav.map': 'Carte',
  'nav.favorites': 'Vos favoris',
  'nav.stay': 'Séjour',
} as const

export type TranslationKey = keyof typeof fr

export function t(key: TranslationKey, params?: Record<string, string>): string {
  let value: string = fr[key]
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(`{${k}}`, v)
    }
  }
  return value
}
