export type MarketingNavigationItem = { href: string; label: string }

export const marketingNavigation: readonly MarketingNavigationItem[] = [
  { href: '/#services', label: 'Nos services' },
  { href: '/logements', label: 'Nos logements' },
  { href: '/seminaires', label: 'Séminaires' },
  { href: '/concept', label: 'Notre approche' },
  { href: '/blog', label: 'Journal' },
]

/**
 * « Nos services » est masqué sur la home (la section est déjà sous les yeux)
 * et mène à `/#services` ailleurs (spec 031 AC-01-10 (6)).
 */
export function marketingNavigationFor(pathname: string | null): MarketingNavigationItem[] {
  return marketingNavigation.filter(item => pathname !== '/' || item.href !== '/#services')
}
