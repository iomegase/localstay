type Candidate = {
  primary_source_type: string
  title: string
  source_refs?: unknown
  geometry_geojson?: unknown
  geometry_status?: string
  start_latitude?: number | null
  start_longitude?: number | null
}

type SourceRef = { type: string; attribution: string; used_for: string[] }

const STOP_WORDS = new Set([
  'le', 'la', 'les', 'l', 'du', 'de', 'des', 'd',
  'et', 'a', 'au', 'aux', 'sur', 'sous', 'depuis',
  'en', 'par', 'vers', 'via', 'pour', 'avec', 'sans',
  'boucle', 'tour', 'circuit', 'rando', 'randonnee', 'sentier', 'chemin',
])

const DIACRITICS_RE = new RegExp('[̀-ͯ]', 'g')

function normalizeTitle(title: string): string[] {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 1 && !STOP_WORDS.has(token))
}

// Score 0..1 : intersection / max(|missing|, |donor|)
// On veut un match fort dans la direction qui pose problème (overlap relatif au plus petit set).
// Plus tolérant que Jaccard pour les cas "Mont Joly" (donor) vs "Mont Joly par les Communailles" (missing).
function inheritanceScore(missingTokens: Set<string>, donorTokens: Set<string>): number {
  if (missingTokens.size === 0 || donorTokens.size === 0) return 0
  let inter = 0
  for (const t of donorTokens) if (missingTokens.has(t)) inter += 1
  return inter / Math.min(missingTokens.size, donorTokens.size)
}

const INHERIT_THRESHOLD = 0.75
const MIN_OVERLAP_TOKENS = 2

export type InheritanceResult = {
  inherited: number
  details: Array<{ recipient: string; donor: string; score: number }>
}

export function inheritGeometryByTitle<T extends Candidate>(candidates: T[]): InheritanceResult {
  const donors = candidates
    .map((c, idx) => ({ c, idx, tokens: new Set(normalizeTitle(c.title)) }))
    .filter(entry => entry.c.geometry_status === 'valid' && entry.c.geometry_geojson)

  const details: InheritanceResult['details'] = []
  let inherited = 0

  for (const candidate of candidates) {
    if (candidate.geometry_status === 'valid') continue
    const missingTokens = new Set(normalizeTitle(candidate.title))
    if (missingTokens.size < MIN_OVERLAP_TOKENS) continue

    let bestDonor: typeof donors[number] | null = null
    let bestScore = 0

    for (const donor of donors) {
      const score = inheritanceScore(missingTokens, donor.tokens)
      if (score < INHERIT_THRESHOLD) continue
      const overlap = countOverlap(missingTokens, donor.tokens)
      if (overlap < MIN_OVERLAP_TOKENS) continue
      if (score > bestScore) {
        bestScore = score
        bestDonor = donor
      }
    }

    if (!bestDonor) continue

    candidate.geometry_geojson = bestDonor.c.geometry_geojson
    candidate.geometry_status = 'valid'
    if (candidate.start_latitude == null && bestDonor.c.start_latitude != null) {
      candidate.start_latitude = bestDonor.c.start_latitude
    }
    if (candidate.start_longitude == null && bestDonor.c.start_longitude != null) {
      candidate.start_longitude = bestDonor.c.start_longitude
    }

    const refs = Array.isArray(candidate.source_refs) ? [...candidate.source_refs as unknown[]] : []
    const inheritedRef: SourceRef = {
      type: 'inherited',
      attribution: `Géométrie héritée de "${bestDonor.c.title}" (${bestDonor.c.primary_source_type})`,
      used_for: ['geometry'],
    }
    refs.push(inheritedRef)
    candidate.source_refs = refs

    inherited += 1
    details.push({ recipient: candidate.title, donor: bestDonor.c.title, score: bestScore })
  }

  return { inherited, details }
}

function countOverlap(a: Set<string>, b: Set<string>): number {
  let n = 0
  for (const t of a) if (b.has(t)) n += 1
  return n
}
