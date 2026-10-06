const LODGING_DETAIL_ROUTE = /^\/guide\/([^/]+)\/logements\/([^/]+)$/
const GLOBAL_LODGING_DETAIL_ROUTE = /^\/logements\/[^/]+$/
const CITY_LODGINGS_ROUTE = /^\/guide\/([^/]+)\/logements$/
const CITY_CONTACT_ROUTE = /^\/guide\/([^/]+)\/contact$/
const CITY_GUIDE_ROUTE = /^\/guide\/([^/]+)$/
// Spec 075 AC-03-01 : pages publiques actuelles rattachées à une ville.
const CURRENT_CITY_ROUTES: Array<[RegExp, AnalyticsPageType]> = [
  [/^\/decouvrir\/([^/]+)(?:\/.*)?$/, 'city_discovery'],
  [/^\/conciergerie\/([^/]+)$/, 'city_concierge'],
  [/^\/seminaires\/([^/]+)$/, 'city_seminars'],
  [/^\/locations-vacances\/([^/]+)$/, 'city_lodgings'],
]

export type AnalyticsPageType =
  | 'city_guide'
  | 'city_contact'
  | 'city_lodgings'
  | 'lodging_detail'
  | 'city_discovery'
  | 'city_concierge'
  | 'city_seminars'
  | 'global'

export function resolveAnalyticsCityContext(pathname: string): {
  citySlug: string | null
  pageType: AnalyticsPageType
} {
  const normalizedPath = pathname.split('?')[0].replace(/\/+$/, '') || '/'

  if (GLOBAL_LODGING_DETAIL_ROUTE.test(normalizedPath)) {
    return {
      citySlug: null,
      pageType: 'lodging_detail',
    }
  }

  for (const [route, pageType] of CURRENT_CITY_ROUTES) {
    const current = normalizedPath.match(route)
    if (current) return { citySlug: current[1], pageType }
  }

  let match = normalizedPath.match(LODGING_DETAIL_ROUTE)
  if (match) {
    return {
      citySlug: match[1],
      pageType: 'lodging_detail',
    }
  }

  match = normalizedPath.match(CITY_LODGINGS_ROUTE)
  if (match) {
    return {
      citySlug: match[1],
      pageType: 'city_lodgings',
    }
  }

  match = normalizedPath.match(CITY_CONTACT_ROUTE)
  if (match) {
    return {
      citySlug: match[1],
      pageType: 'city_contact',
    }
  }

  match = normalizedPath.match(CITY_GUIDE_ROUTE)
  if (match) {
    return {
      citySlug: match[1],
      pageType: 'city_guide',
    }
  }

  return {
    citySlug: null,
    pageType: 'global',
  }
}
