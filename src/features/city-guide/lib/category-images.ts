/**
 * Mapping best-effort slug de catégorie → photo statique (/public/home).
 * Les slugs absents reçoivent un dégradé de fallback déterministe.
 */
export const CATEGORY_IMAGE_BY_SLUG: Record<string, string> = {
  boulangerie: '/home/bakery.png',
  rando: '/home/outdoor.png',
  bars: '/home/pub.png',
  culture: '/home/art.png',
  diner: '/home/resto.png',
  restaurants: '/home/resto.png',
}

export function getCategoryImage(slug: string): string | null {
  return CATEGORY_IMAGE_BY_SLUG[slug] ?? null
}

const FALLBACK_GRADIENTS = [
  'from-[#007AFF] to-[#5AC8FA]',
  'from-[#AF52DE] to-[#FF2D55]',
  'from-[#34C759] to-[#30D158]',
  'from-[#FF9500] to-[#FFCC00]',
  'from-[#5856D6] to-[#AF52DE]',
]

/** Dégradé Tailwind déterministe (hash simple du slug). */
export function getFallbackGradient(slug: string): string {
  let hash = 0
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0
  }
  return FALLBACK_GRADIENTS[hash % FALLBACK_GRADIENTS.length]
}
