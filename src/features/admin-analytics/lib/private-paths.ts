// Spec 075 BR-01 : chemins privés, exclus de la mesure GA4.
export const PRIVATE_ANALYTICS_PATH_PREFIXES = [
  '/admin',
  '/auth',
  '/login',
  '/dashboard',
  '/merchant',
  '/connexion',
  '/acces-reserve',
  '/cities',
  '/api',
] as const

export function isPrivateAnalyticsPath(pathname: string): boolean {
  const path = pathname.split('?')[0] ?? ''
  return PRIVATE_ANALYTICS_PATH_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`))
}

/** Spec 075 AC-02-02 : filtre GA4 Data API excluant les chemins privés. */
export function ga4PublicPathsFilter(): Record<string, unknown> {
  const names = PRIVATE_ANALYTICS_PATH_PREFIXES.map(prefix => prefix.slice(1)).join('|')
  return {
    notExpression: {
      filter: {
        fieldName: 'pagePath',
        stringFilter: { matchType: 'FULL_REGEXP', value: `^/(${names})(/.*)?$` },
      },
    },
  }
}
