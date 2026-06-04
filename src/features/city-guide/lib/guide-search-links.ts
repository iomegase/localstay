/**
 * Liens des résultats de recherche du guide. Préservent le contexte logement
 * (`?lodging=`) pour rester en « mode séjour » après un clic.
 */
export function appendLodging(path: string, lodgingId?: string | null): string {
  if (!lodgingId) return path
  return `${path}?lodging=${encodeURIComponent(lodgingId)}`
}

export function poiResultHref(
  citySlug: string,
  categorySlug: string,
  poiSlug: string,
  lodgingId?: string | null,
): string {
  return appendLodging(`/guide/${citySlug}/${categorySlug}/${poiSlug}`, lodgingId)
}

export function categoryResultHref(
  citySlug: string,
  categorySlug: string,
  lodgingId?: string | null,
): string {
  return appendLodging(`/guide/${citySlug}/${categorySlug}`, lodgingId)
}
