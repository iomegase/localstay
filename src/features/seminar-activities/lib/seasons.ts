// Spec 097 UI public (ajustement PO du 2026-10-14) : la saison s'affiche en icônes.

export type Season = 'winter' | 'spring' | 'summer' | 'autumn'

export const SEASONS: readonly Season[] = ['winter', 'spring', 'summer', 'autumn']

export const SEASON_LABELS: Record<Season, string> = {
  winter: 'Hiver',
  spring: 'Printemps',
  summer: 'Été',
  autumn: 'Automne',
}

const SEASON_WORDS: Record<string, Season> = { hiver: 'winter', printemps: 'spring', ete: 'summer', automne: 'autumn' }
const ALL_YEAR = 'toute l’annee'

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/'/g, '’').toLowerCase().trim()
}

/**
 * Lit un libellé de saison : « Toute l'année [précision] » → 4 saisons + précision,
 * « Printemps, été » → saisons citées. Autre libellé (« Selon conditions ») → null :
 * la carte affiche alors le texte tel quel.
 */
export function parseSeasonLabel(label: string): { seasons: Season[]; note: string | null } | null {
  const normalized = normalize(label)
  if (normalized.startsWith(ALL_YEAR)) {
    const note = label.trim().slice(ALL_YEAR.length).trim()
    return { seasons: [...SEASONS], note: note || null }
  }
  const words = normalized.split(',').map(word => word.trim())
  if (!words.length || !words.every(word => word in SEASON_WORDS)) return null
  const found = new Set(words.map(word => SEASON_WORDS[word]!))
  return { seasons: SEASONS.filter(season => found.has(season)), note: null }
}
