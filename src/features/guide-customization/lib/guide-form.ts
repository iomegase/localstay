// Spec 077 US-04 : sections de la page Guide et suivi des modifications non enregistrées.

export const GUIDE_SECTIONS = [
  { id: 'logement', title: 'Le logement', description: 'Ce que le voyageur découvre en ouvrant le guide.' },
  { id: 'arrivee', title: 'Arrivée', description: 'Tout pour entrer sans vous appeler.' },
  { id: 'sur-place', title: 'Sur place', description: 'Wi-Fi, point de tri, numéros et consignes.' },
  { id: 'recommandations', title: 'Recommandations', description: 'Vos adresses et l’ordre des catégories.' },
] as const

export type GuideSectionId = (typeof GUIDE_SECTIONS)[number]['id']

/** Empreinte stable de l'état du formulaire : comparée à celle de la dernière sauvegarde. */
export function guideFormSnapshot(state: Record<string, unknown>): string {
  return JSON.stringify(state)
}
