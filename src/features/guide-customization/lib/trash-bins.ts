/**
 * Catalogue des bacs à poubelles (tri sélectif français) — preset partagé
 * backoffice + front. Chaque bac : type stable, libellé, couleur de l'icône.
 */

export const TRASH_BIN_TYPES = ['jaune', 'verte', 'bordeaux', 'marron', 'bleue'] as const

export type TrashBinType = (typeof TRASH_BIN_TYPES)[number]

/**
 * Forme stockée / renvoyée : uniquement le type. Le libellé et la description
 * affichés proviennent du preset (label / hint) — pas de saisie owner.
 */
export interface TrashBin {
  type: TrashBinType
}

/** Forme saisie (avant normalisation). */
export interface TrashBinInput {
  type: string
}

export interface TrashBinPreset {
  type: TrashBinType
  label: string
  /** Aide affichée au backoffice pour guider la description. */
  hint: string
  /** Classe Tailwind teintant l'icône Trash2. */
  colorClass: string
}

export const TRASH_BINS: readonly TrashBinPreset[] = [
  { type: 'jaune', label: 'Poubelle jaune', hint: 'Emballages & papiers recyclables', colorClass: 'text-yellow-400' },
  { type: 'verte', label: 'Poubelle verte', hint: 'Verre', colorClass: 'text-green-600' },
  { type: 'bordeaux', label: 'Poubelle bordeaux', hint: 'Ordures ménagères', colorClass: 'text-red-900' },
  { type: 'marron', label: 'Poubelle marron', hint: 'Déchets alimentaires / compost', colorClass: 'text-amber-800' },
  { type: 'bleue', label: 'Poubelle bleue', hint: 'Papier', colorClass: 'text-blue-500' },
]

const BY_TYPE = new Map<string, TrashBinPreset>(TRASH_BINS.map(bin => [bin.type, bin]))

export function getTrashBin(type: string): TrashBinPreset | undefined {
  return BY_TYPE.get(type)
}

export function isTrashBinType(value: string): value is TrashBinType {
  return BY_TYPE.has(value)
}
