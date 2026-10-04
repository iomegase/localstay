import { createHash } from 'node:crypto'

/** Spec 061 A1 : champ de contenu traduisible (entity_type / entity_id / field_name de 027). */
export type TranslationSource = {
  entityType: string
  entityId: string
  field: string
  text: string
}

export function translationKey(entityType: string, entityId: string, field: string): string {
  return `${entityType}:${entityId}:${field}`
}

/** Empreinte du texte français courant (027 `source_text_hash`). */
export function hashSourceText(text: string): string {
  return createHash('sha256').update(text.trim()).digest('hex')
}

/** Statuts publiables pour la policy `auto_publish` (027 BR-16). */
export const PUBLISHABLE_STATUSES = ['auto_translated', 'approved'] as const
