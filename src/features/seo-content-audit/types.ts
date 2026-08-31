export type SeoContentAuditFinding = {
  publicUrl: string
  entityType: 'poi' | 'lodging' | 'public-page'
  entityId: string | null
  code:
    | 'CONTENT_TOO_THIN'
    | 'EXACT_INTERNAL_DUPLICATE'
    | 'HIGH_INTERNAL_SIMILARITY'
    | 'PLACEHOLDER_CONTENT'
    | 'EXTERNAL_SOURCE_REVIEW_REQUIRED'
    | 'LODGING_STRUCTURED_TEXT_CONFLICT'
    | 'JSON_LD_VISIBLE_CONTENT_CONFLICT'
  evidence: string[]
  updatedAt: string | null
  requiresOwnerDecision: boolean
}

