export type EmergencyNumber = {
  number: string
  label: string
}

/**
 * Numéros d'urgence français, en dur : identiques pour tous les logements,
 * jamais saisis par le propriétaire. Affichés dans « Informations pratiques ».
 */
export const FRENCH_EMERGENCY_NUMBERS: readonly EmergencyNumber[] = [
  // Spec 050 AC-01-05 : urgence unique 112 (décision PO du 2026-09-29).
  { number: '112', label: 'Urgences (numéro européen)' },
]
