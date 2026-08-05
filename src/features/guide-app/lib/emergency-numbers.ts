export type EmergencyNumber = {
  number: string
  label: string
}

/**
 * Numéros d'urgence français, en dur : identiques pour tous les logements,
 * jamais saisis par le propriétaire. Affichés dans « Informations pratiques ».
 */
export const FRENCH_EMERGENCY_NUMBERS: readonly EmergencyNumber[] = [
  { number: '112', label: 'Urgences (numéro européen)' },
  { number: '114', label: 'Urgence par SMS (sourds & malentendants)' },
]
