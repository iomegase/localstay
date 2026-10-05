/**
 * Spec 021 AC-02-07 (PO 2026-10-05) : fermer le guidage rando ramène à la fiche de la
 * randonnée dans le guide, pas à son accueil. Le guide garde la fiche ouverte en mémoire
 * React ; on la note pour l'onglet courant avant d'ouvrir le guidage, puis on la relit
 * une seule fois au retour.
 */
const KEY = 'mystay:guide-trail-return'

export function rememberTrailReturn(poiId: string): void {
  try {
    window.sessionStorage.setItem(KEY, poiId)
  } catch {
    // Stockage indisponible (navigation privée) : retour à l'accueil du guide.
  }
}

export function takeTrailReturn(): string | null {
  try {
    const poiId = window.sessionStorage.getItem(KEY)
    window.sessionStorage.removeItem(KEY)
    return poiId
  } catch {
    return null
  }
}
