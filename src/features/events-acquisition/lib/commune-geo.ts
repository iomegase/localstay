// Résolution d'une commune (nom ou code INSEE) → coordonnées de son centre,
// via l'API publique gratuite geo.api.gouv.fr. Utilisé pour la recherche admin
// "n'importe quelle commune", qui alimente ensuite geo_distance côté DATAtourisme.

export interface ResolvedCommune {
  insee: string
  name: string
  latitude: number
  longitude: number
}

const GEO_BASE = 'https://geo.api.gouv.fr/communes'

function isInsee(value: string): boolean {
  return /^[0-9]{5}$/.test(value.trim())
}

export async function resolveCommune(
  query: string,
  options: { department?: string } = {},
): Promise<ResolvedCommune | null> {
  const q = query.trim()
  if (!q) return null

  const params = new URLSearchParams({ fields: 'nom,code,centre', limit: '1' })
  if (isInsee(q)) {
    params.set('code', q)
  } else {
    params.set('nom', q)
    params.set('codeDepartement', options.department ?? '74')
    params.set('boost', 'population')
  }

  const res = await fetch(`${GEO_BASE}?${params.toString()}`)
  if (!res.ok) throw new Error(`geo.api.gouv.fr failed: ${res.status}`)

  const data = (await res.json()) as Array<{
    nom?: string
    code?: string
    centre?: { coordinates?: number[] }
  }>
  const first = Array.isArray(data) ? data[0] : null
  const coords = first?.centre?.coordinates
  if (!first?.code || !first?.nom || !coords) return null

  const [longitude, latitude] = coords
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null

  return { insee: first.code, name: first.nom, latitude, longitude }
}
