type SearchablePoi = {
  name: string
  category: { name: string }
  description?: string
  shortDescription?: string
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('fr-FR').trim()
}

/** Recherche locale sur le nom, la catégorie et la description (spec 056 AC-01-02). */
export function filterPoisByQuery<P extends SearchablePoi>(pois: readonly P[], query: string): P[] {
  const needle = normalize(query)
  if (!needle) return [...pois]
  return pois.filter(poi =>
    [poi.name, poi.category.name, poi.description ?? '', poi.shortDescription ?? '']
      .some(text => normalize(text).includes(needle)),
  )
}

/** Distance à vol d'oiseau lisible : « 350 m », « 1,2 km », « 15 km » (spec 056 AC-01-04). */
export function formatDistanceMeters(meters: number): string {
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`
  const kilometers = meters / 1000
  return kilometers < 10
    ? `${kilometers.toLocaleString('fr-FR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} km`
    : `${Math.round(kilometers)} km`
}

/** « Saint-Gervais-les-Bains » → « Saint-Gervais » (titre de l'onglet Guide). */
export function guideCityTitle(city: string): string {
  return city.replace(/-les-bains$/i, '')
}
