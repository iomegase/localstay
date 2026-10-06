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
  // Spec 084 AC-03 : pas de ville en double si l'adresse contient déjà un code postal ou la ville.
  const query = value
    ? (mentionsCity(value, city) ? value : `${value} ${city}`)
    : `point de tri ${city}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

const comparable = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

function mentionsCity(value: string, city: string): boolean {
  return /\b\d{5}\b/.test(value) || comparable(value).includes(comparable(city))
}
