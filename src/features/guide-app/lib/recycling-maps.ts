/** Point de tri du guide logement (spec 054 AC-04-01, PO 2026-10-03). */
export function recyclingMapsHref(location: string | null, city: string): string {
  const value = location?.trim()
  if (value) {
    try {
      const url = new URL(value)
      if (url.protocol === 'https:' || url.protocol === 'http:') return url.href
    } catch {
      // Une indication textuelle devient une recherche avec la ville.
    }
  }
  const query = value ? `${value} ${city}` : `point de tri ${city}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
