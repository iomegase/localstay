/** Constantes d'identité du site, source unique pour SEO/GEO (titres, OG, JSON-LD). */
export const SITE = {
  name: 'MyStay',
  locale: 'fr_FR',
  defaultTitle: 'MyStay — Le guide local de votre séjour',
  defaultDescription:
    'MyStay référence les meilleures adresses, randonnées et activités autour de votre lieu de séjour : restaurants, commerces, sentiers et bons plans locaux.',
} as const

/** URL de base sans slash final. Utilisée pour canonical, sitemap, OG, JSON-LD. */
export function siteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://mystay.city').replace(/\/+$/, '')
}
