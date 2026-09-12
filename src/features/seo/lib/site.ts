

/**
 * Constantes d'identité du site.
 *
 * Source unique pour :
 * - SEO
 * - GEO
 * - titres par défaut
 * - Open Graph
 * - JSON-LD
 */

export const SITE = {
  name: 'MyStay',

  locale: 'fr_FR',

  defaultTitle:
    'MyStay — Conciergerie à Saint-Gervais-les-Bains',

  defaultDescription:
    'MyStay, conciergerie à Saint-Gervais-les-Bains et dans le Pays du Mont-Blanc : accueil voyageurs, ménage, linge, intendance et guides digitaux.',
} as const

/**
 * Identifiant public stable de l'organisation.
 *
 * Cet identifiant doit rester identique dans tous les JSON-LD :
 * Organization, WebSite, LodgingBusiness, BlogPosting, etc.
 */
export function organizationId(): string {
  return 'https://www.mystay.city/#organization'
}

/**
 * URL canonique de base du site, sans slash final.
 *
 * Utilisée notamment pour :
 * - canonical
 * - sitemap
 * - Open Graph
 * - JSON-LD
 */
export function siteBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ??
    'https://www.mystay.city'
  ).replace(/\/+$/, '')
}