export type MarketingNavigationItem = { href: string; label: string }

export type LocalMarketingNavigation = {
  city: { slug: string }
  publication: { concierge: boolean; seminar: boolean; vacationRental: boolean }
}

export const marketingNavigation: readonly MarketingNavigationItem[] = [
  { href: '/', label: 'Accueil' },
  { href: '/logements', label: 'Nos logements' },
  { href: '/seminaires', label: 'Séminaires' },
  { href: '/journal', label: 'Journal' },
]

/**
 * « Accueil » reste visible sur toutes les pages.
 * Les landings locales privilégient leurs pages publiées (spec 046 AC-04-07),
 * avec les liens génériques comme replis (spec 031 AC-01-10 (6)).
 */
export function marketingNavigationFor(_pathname: string | null, localNavigation?: LocalMarketingNavigation): MarketingNavigationItem[] {
  const localLinks: Record<string, string> = localNavigation ? {
    '/': localNavigation.publication.concierge ? `/conciergerie/${localNavigation.city.slug}` : '/',
    '/logements': localNavigation.publication.vacationRental ? `/locations-vacances/${localNavigation.city.slug}` : '/logements',
    '/seminaires': localNavigation.publication.seminar ? `/seminaires/${localNavigation.city.slug}` : '/seminaires',
  } : {}
  return marketingNavigation
    .map(item => ({ ...item, href: localLinks[item.href] ?? item.href }))
}
