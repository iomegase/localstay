import { z } from 'zod'

// Spec 102 AC-01-02 : lieux nommés de l'IGN (Géoplateforme, index « poi » : lacs, cols, sommets…).
const ENDPOINT = 'https://data.geopf.fr/geocodage/search'
const TIMEOUT_MS = 10_000

const schema = z.object({
  features: z.array(z.object({
    geometry: z.object({ coordinates: z.tuple([z.number(), z.number()]) }),
    properties: z.object({ toponym: z.string().optional(), name: z.union([z.string(), z.array(z.string())]).optional() }).passthrough(),
  })),
})

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

function distanceKm(a: [number, number], b: [number, number]): number {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(b[1] - a[1])
  const dLng = toRad(b[0] - a[0])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

/**
 * Lieu IGN au nom identique (sans casse ni accents) à `maxKm` au plus de `near` ([lng, lat]).
 * « Lac de l'Etape » ne renvoie donc jamais la « Retenue de l'Étale » de La Clusaz. null sinon.
 */
export async function findIgnPlace(name: string, near: [number, number], maxKm = 15): Promise<{ name: string; coord: [number, number] } | null> {
  const wanted = normalize(name)
  if (wanted.length < 3) return null
  try {
    const url = `${ENDPOINT}?${new URLSearchParams({ q: name, index: 'poi', limit: '10', lon: String(near[0]), lat: String(near[1]) })}`
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store' })
    if (!response.ok) return null
    const parsed = schema.safeParse(await response.json())
    if (!parsed.success) return null
    for (const feature of parsed.data.features) {
      const names = [feature.properties.toponym, ...[feature.properties.name ?? []].flat()].filter((value): value is string => Boolean(value))
      const coord = feature.geometry.coordinates
      if (names.some(candidate => normalize(candidate) === wanted) && distanceKm(near, coord) <= maxKm) {
        return { name: names[0]!, coord }
      }
    }
    return null
  } catch {
    return null
  }
}
