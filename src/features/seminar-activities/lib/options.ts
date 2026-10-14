// Spec 097 UI admin (ajustement PO du 2026-10-14) : listes proposées pour la saison et le niveau.
// Les libellés restent stockés en texte ; une valeur hors liste déjà enregistrée reste sélectionnable.

export const SEMINAR_SEASON_OPTIONS: readonly string[] = [
  'Toute l’année',
  'Hiver',
  'Printemps, été',
  'Été',
  'Printemps, été, automne',
  'Toute l’année selon la formule',
  'Toute l’année selon installation',
  'Toute l’année selon conditions',
  'Toute l’année selon producteur',
  'Toute l’année selon calendrier',
  'Toute l’année selon ouverture',
  'Toute l’année sur réservation',
  'Selon ouverture',
  'Selon ouverture du téléphérique',
  'Selon conditions',
]

export const SEMINAR_LEVEL_OPTIONS: readonly string[] = [
  'Tous niveaux',
  'Tous publics',
  'Accessible',
  'Accessible à sportif',
  'Modéré',
  'Modéré à sportif',
  'Sportif',
  'Adaptable',
  'Adultes',
  'Tous niveaux selon site',
  'Tous publics pour la visite',
  'Accessible selon conditions',
  'Accessible sous conditions',
]

/** Options d'un select, en conservant une valeur enregistrée absente de la liste. */
export function optionsWithCurrent(options: readonly string[], current: string): string[] {
  return current && !options.includes(current) ? [current, ...options] : [...options]
}
