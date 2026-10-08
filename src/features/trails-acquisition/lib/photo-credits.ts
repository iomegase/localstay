// PO 2026-10-08 : les photos de randonnées tierces (Camptocamp, Geotrek…) ne sont publiées qu'avec le
// crédit de leurs auteurs, affiché sur la page. Les crédits viennent de `TrailDetail.source_refs`.

export type TrailPhotoCredit = { attribution: string; url: string | null }

export function trailPhotoCredits(sourceRefs: unknown): TrailPhotoCredit[] {
  if (!Array.isArray(sourceRefs)) return []
  const seen = new Set<string>()
  const credits: TrailPhotoCredit[] = []
  for (const item of sourceRefs) {
    if (!item || typeof item !== 'object') continue
    const ref = item as { attribution?: unknown; url?: unknown; used_for?: unknown }
    if (!Array.isArray(ref.used_for) || !ref.used_for.includes('photos')) continue
    const attribution = typeof ref.attribution === 'string' ? decodeEntities(ref.attribution).trim() : ''
    if (!attribution || seen.has(attribution)) continue
    seen.add(attribution)
    const url = typeof ref.url === 'string' && /^https?:\/\//.test(ref.url) ? ref.url : null
    credits.push({ attribution, url })
  }
  return credits
}

/** Les galeries d'offices de tourisme livrent parfois « &copy; » ou « &eacute; » encodés. */
function decodeEntities(value: string): string {
  const named: Record<string, string> = { copy: '©', amp: '&', eacute: 'é', egrave: 'è', ecirc: 'ê', agrave: 'à', icirc: 'î', ocirc: 'ô', ccedil: 'ç', quot: '"', apos: "'", nbsp: ' ' }
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&([a-z]+);/gi, (match, name: string) => named[name.toLowerCase()] ?? match)
}
