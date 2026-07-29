export type FavoriteBentoVariant = 'big' | 'compact'

/**
 * Règle de variante bento des « coups de cœur » (mode démo comme privé) :
 * le premier POI occupe la grande carte sur deux colonnes, les suivants
 * restent des cartes compactes sur une colonne. Aucune carte blanche.
 */
export function getFavoriteBentoVariant(index: number): FavoriteBentoVariant {
  return index === 0 ? 'big' : 'compact'
}
