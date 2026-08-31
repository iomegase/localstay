const LODGING_DETAIL_ROUTE = /^\/guide\/([^/]+)\/logements\/([^/]+)$/
const GLOBAL_LODGING_DETAIL_ROUTE = /^\/logements\/[^/]+$/
const CITY_LODGINGS_ROUTE = /^\/guide\/([^/]+)\/logements$/
const CITY_CONTACT_ROUTE = /^\/guide\/([^/]+)\/contact$/
const CITY_GUIDE_ROUTE = /^\/guide\/([^/]+)$/

export type AnalyticsPageType =
  | 'city_guide'
  | 'city_contact'
  | 'city_lodgings'
  | 'lodging_detail'
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
