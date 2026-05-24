export class PoiAcquisitionError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(code)
  }
}

export function messageForPoiAcquisitionCode(code: string): string {
  if (code === 'INVALID_CITY') return 'Ville invalide'
  if (code === 'INVALID_CATEGORY') return 'Catégorie invalide'
  if (code === 'INVALID_SUBCATEGORY') return 'Sous-catégorie invalide'
  if (code === 'MAPBOX_GEOCODE_FAILED') return 'Géocodage Mapbox impossible'
  if (code === 'MAPBOX_GEOCODE_AMBIGUOUS') return 'Géocodage Mapbox ambigu'
  if (code === 'DUPLICATE_POI_CANDIDATE') return 'Doublon POI probable'
  if (code === 'CANDIDATE_NOT_REVIEWABLE') return 'Candidat non reviewable'
  if (code === 'NOT_FOUND') return 'Ressource introuvable'
  return 'Erreur acquisition POI'
}
