export type TrailsAcquisitionErrorCode =
  | 'VALIDATION_ERROR'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'SOURCE_NOT_ALLOWED'
  | 'CANDIDATE_NOT_REVIEWABLE'
  | 'TRAIL_GEOMETRY_REQUIRED'
  | 'TRAIL_START_POINT_REQUIRED'
  | 'DUPLICATE_TRAIL_CANDIDATE'
  | 'INVALID_CITY'
  | 'INVALID_RANDO_CATEGORY'

export class TrailsAcquisitionError extends Error {
  constructor(
    public readonly code: TrailsAcquisitionErrorCode,
    public readonly status: number,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(code)
  }
}

export function messageForTrailsAcquisitionCode(code: string): string {
  if (code === 'SOURCE_NOT_ALLOWED') return 'Source randonnée non autorisée'
  if (code === 'CANDIDATE_NOT_REVIEWABLE') return 'Candidat randonnée non reviewable'
  if (code === 'TRAIL_GEOMETRY_REQUIRED') return 'Géométrie randonnée requise'
  if (code === 'TRAIL_START_POINT_REQUIRED') return 'Point de départ randonnée requis'
  if (code === 'DUPLICATE_TRAIL_CANDIDATE') return 'Doublon randonnée probable'
  if (code === 'INVALID_CITY') return 'Ville invalide'
  if (code === 'INVALID_RANDO_CATEGORY') return 'Catégorie Rando invalide'
  if (code === 'NOT_FOUND') return 'Ressource introuvable'
  if (code === 'FORBIDDEN') return 'Accès refusé'
  return 'Erreur acquisition randonnée'
}
