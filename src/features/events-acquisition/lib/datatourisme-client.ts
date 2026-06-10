// Client de l'API REST v1 DATAtourisme (https://api.datatourisme.fr/v1).
// On interroge l'endpoint pré-filtré /entertainmentAndEvent avec un filtre
// géographique geo_distance (seul filtre serveur honoré) + projection `fields`
// (qui inclut takesPlaceAt), en suivant la pagination via meta.next.

const BASE = 'https://api.datatourisme.fr/v1/entertainmentAndEvent'
const DETAIL_BASE = 'https://api.datatourisme.fr/v1/catalog'
const FIELDS =
  'uuid,identifier,label,type,takesPlaceAt,isLocatedAt,hasDescription,hasContact,hasMainRepresentation,lastUpdate'
const PAGE_SIZE = 250

export interface FetchEventsParams {
  latitude: number
  longitude: number
  radiusKm: number
  apiKey?: string
  /** Garde-fou anti-boucle (quotas: 1000 req/h). 250 events/page → 20 pages = 5000 events max. */
  maxPages?: number
}

export async function fetchEventsNear({
  latitude,
  longitude,
  radiusKm,
  apiKey = process.env.DATATOURISME_API_KEY,
  maxPages = 20,
}: FetchEventsParams): Promise<unknown[]> {
  if (!apiKey) throw new Error('DATATOURISME_API_KEY is not set')

  const headers = { 'X-API-Key': apiKey, Accept: 'application/json' }
  const params = new URLSearchParams({
    fields: FIELDS,
    page_size: String(PAGE_SIZE),
    geo_distance: `${latitude},${longitude},${radiusKm}km`,
  })

  let url: string | null = `${BASE}?${params.toString()}`
  const objects: unknown[] = []
  let pages = 0

  while (url && pages < maxPages) {
    const res = await fetch(url, { headers })
    if (!res.ok) throw new Error(`DATAtourisme API failed: ${res.status}`)
    const data = (await res.json()) as { objects?: unknown[]; meta?: { next?: string | null } }
    if (Array.isArray(data.objects)) objects.push(...data.objects)
    url = data.meta?.next ?? null
    pages++
  }

  return objects
}

/**
 * Détail d'un objet (/v1/catalog/{uuid}). À utiliser pour récupérer les champs
 * absents de la liste — notamment les images (hasMainRepresentation).
 */
export async function fetchEventDetail(
  uuid: string,
  apiKey: string | undefined = process.env.DATATOURISME_API_KEY,
): Promise<unknown> {
  if (!apiKey) throw new Error('DATATOURISME_API_KEY is not set')
  const res = await fetch(`${DETAIL_BASE}/${encodeURIComponent(uuid)}`, {
    headers: { 'X-API-Key': apiKey, Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`DATAtourisme detail failed: ${res.status}`)
  return res.json()
}
