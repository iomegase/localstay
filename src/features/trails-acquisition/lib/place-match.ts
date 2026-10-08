// Correspondance stricte d'un nom de randonnée avec un lieu ou une randonnée d'une autre source.

export function normalizePlaceName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

const ARTICLE = /^(le|la|les|l)\s+/
const PREFIX = /^(boucle|tour|balade|sentier|randonnee|promenade)\s+(du|de la|des|de|d|au|aux|a la|a l)\s+/
const SUFFIX = /\s+(depuis|par|en boucle|aller retour|via)\b.*$/

/** Noms de lieux cherchés : le titre, puis chacune de ses parties (« A - B », « A et B »). */
export function placeQueries(title: string): string[] {
  const parts = [title, ...title.split(/\s+(?:-|–|>|et)\s+/i)]
  const queries = parts.map(part => normalizePlaceName(part).replace(PREFIX, '').replace(SUFFIX, '').replace(ARTICLE, '').trim())
  return [...new Set(queries)].filter(query => query.length >= 4)
}

/** Correspondance stricte : nom identique, ou l'un contient l'autre avec au moins deux mots. */
export function isSamePlace(query: string, candidateName: string): boolean {
  const name = normalizePlaceName(candidateName).replace(ARTICLE, '')
  if (!name) return false
  if (name === query) return true
  const shorter = query.length <= name.length ? query : name
  const longer = shorter === query ? name : query
  return shorter.split(' ').length >= 2 && longer.includes(shorter)
}
