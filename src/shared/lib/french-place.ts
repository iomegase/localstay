export function formatFrenchPlaceReference(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return ''

  const normalized = trimmed.replace(/\s+/g, ' ')
  const lower = normalized.toLocaleLowerCase('fr-FR')

  if (lower.startsWith('le ')) return `au ${normalized.slice(3).trim()}`
  if (lower.startsWith('la ')) return `à la ${normalized.slice(3).trim()}`
  if (lower.startsWith('les ')) return `aux ${normalized.slice(4).trim()}`
  if (lower.startsWith("l'")) {
    return `à l'${normalized.slice(2)}`
  }
  if (lower.startsWith('l"')) {
    return `à l"${normalized.slice(2)}`
  }
  if (lower.startsWith('l’')) {
    return `à l’${normalized.slice(2)}`
  }

  return `à ${normalized}`
}

export function formatFrenchWelcomeLine(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return 'Bienvenue'

  return `Bienvenue ${formatFrenchPlaceReference(trimmed)}`
}

// Spec 031 AC-01-28 (PO 2026-10-17) : prépositions devant un nom de commune.
// L'article fait partie du nom officiel : « Le » et « Les » se contractent avec « à » / « de »
// (au, aux, du, des) ; « La » et « L' » gardent leur majuscule (à La Clusaz, de L'Alpe) ;
// « de » s'élide devant une voyelle (d'Annecy).
// « Le », « La », « Les » suivis d'une espace (pas « Lesquin »), ou « L' » élidé.
const ARTICLE = /^(?:(les|le|la)\s+|(l)['’]\s*)/i
const VOWEL = /^[aeiouyàâäéèêëîïôöùûüœæ]/i

function splitArticle(name: string): { article: 'le' | 'la' | 'les' | 'l' | null; rest: string; raw: string } {
  const normalized = name.trim().replace(/\s+/g, ' ')
  const match = normalized.match(ARTICLE)
  if (!match) return { article: null, rest: normalized, raw: normalized }
  const article = match[2] ? 'l' : (match[1].toLocaleLowerCase('fr-FR') as 'le' | 'la' | 'les')
  return { article, rest: normalized.slice(match[0].length), raw: normalized }
}

/** « à Megève », « au Fayet », « aux Contamines-Montjoie », « à La Clusaz », « à L'Alpe ». */
export function atPlace(name: string): string {
  const { article, rest, raw } = splitArticle(name)
  if (!raw) return ''
  if (article === 'le') return `au ${rest}`
  if (article === 'les') return `aux ${rest}`
  return `à ${raw}`
}

/** « de Megève », « du Fayet », « des Contamines-Montjoie », « de La Clusaz », « d'Annecy ». */
export function ofPlace(name: string): string {
  const { article, rest, raw } = splitArticle(name)
  if (!raw) return ''
  if (article === 'le') return `du ${rest}`
  if (article === 'les') return `des ${rest}`
  if (!article && VOWEL.test(raw)) return `d’${raw}`
  return `de ${raw}`
}

/** Variante en début de phrase : « À Megève », « Aux Contamines-Montjoie ». */
export function capitalizeFirst(text: string): string {
  return text ? text.charAt(0).toLocaleUpperCase('fr-FR') + text.slice(1) : text
}
