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
  { number: '15', label: 'SAMU — urgences médicales' },
  { number: '18', label: 'Pompiers' },
  { number: '17', label: 'Police / Gendarmerie' },
  { number: '114', label: 'Urgence par SMS (sourds & malentendants)' },
  { number: '115', label: 'Samu social (sans-abri)' },
  { number: '119', label: 'Enfance en danger' },
]
