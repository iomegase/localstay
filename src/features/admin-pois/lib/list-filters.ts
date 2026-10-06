import type { AdminPoiListFilters } from '../types'

export type SearchParamsRecord = Record<string, string | string[] | undefined>

/** Spec 068 BR-03 : filtres de la liste POI, portés par l'URL, dans un ordre stable. */
const LIST_FILTER_KEYS = [
  'city_id',
  'q',
  'category_id',
  'subcategory_id',
  'status',
  'geocode_status',
  'photo_status',
  'review_source',
  'discovery_status',
  'page',
  'limit',
] as const

export function firstParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  return raw && raw.length > 0 ? raw : undefined
}

export function adminPoiListQuery(params: SearchParamsRecord): string {
  const query = new URLSearchParams()
  for (const key of LIST_FILTER_KEYS) {
    const value = firstParam(params[key])
    if (value !== undefined) query.set(key, value)
  }
  return query.toString()
}

function withQuery(path: string, params: SearchParamsRecord): string {
  const query = adminPoiListQuery(params)
  return query ? `${path}?${query}` : path
}

/** Spec 068 AC-02-03 : retour à la liste avec tous ses filtres. */
export function adminPoiListHref(params: SearchParamsRecord): string {
  return withQuery('/admin/pois', params)
}

export function adminPoiPanelHref(poiId: string, params: SearchParamsRecord): string {
  return withQuery(`/admin/pois/${poiId}`, params)
}

export function adminPoiCreateHref(params: SearchParamsRecord): string {
  return withQuery('/admin/pois/new', params)
}

export type PanelNeighbors = {
  index: number
  total: number
  previousHref: string | null
  nextHref: string | null
}

/** Spec 068 AC-04-01 / AC-04-02 : position dans la page courante, sans navigation inter-pages. */
export function panelNeighbors(ids: string[], poiId: string, params: SearchParamsRecord): PanelNeighbors | null {
  const position = ids.indexOf(poiId)
  if (position === -1) return null

  const previous = ids[position - 1]
  const next = ids[position + 1]
  return {
    index: position + 1,
    total: ids.length,
    previousHref: previous ? adminPoiPanelHref(previous, params) : null,
    nextHref: next ? adminPoiPanelHref(next, params) : null,
  }
}

export function buildAdminPoiListFilters(cityId: string, params: SearchParamsRecord): AdminPoiListFilters {
  return {
    city_id: cityId,
    q: firstParam(params.q),
    category_id: firstParam(params.category_id),
    subcategory_id: firstParam(params.subcategory_id),
    status: parseStatus(firstParam(params.status)),
    geocode_status: firstParam(params.geocode_status),
    photo_status: parsePhotoStatus(firstParam(params.photo_status)),
    review_source: parseReviewSource(firstParam(params.review_source)),
    discovery_status: parseDiscoveryStatus(firstParam(params.discovery_status)),
    page: Number(firstParam(params.page) ?? 1),
    limit: Number(firstParam(params.limit) ?? 25),
  }
}

function parseStatus(value: string | undefined): AdminPoiListFilters['status'] {
  if (value === 'active' || value === 'inactive' || value === 'archived' || value === 'current') return value
  return 'current'
}

function parsePhotoStatus(value: string | undefined): AdminPoiListFilters['photo_status'] {
  if (value === 'with_photos' || value === 'without_photos') return value
  return undefined
}

function parseReviewSource(value: string | undefined): AdminPoiListFilters['review_source'] {
  if (value === 'MANUAL' || value === 'GOOGLE') return value
  return undefined
}

export function parseDiscoveryStatus(value: string | undefined): AdminPoiListFilters['discovery_status'] {
  if (value === 'DRAFT' || value === 'PUBLISHED') return value
  return undefined
}
