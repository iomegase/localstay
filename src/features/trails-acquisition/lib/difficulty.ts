import type { TrailDifficulty } from '../types'

export function normalizeTrailDifficulty(value: string | null | undefined): TrailDifficulty {
  const normalized = value?.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  if (!normalized) return 'unknown'
  if (['facile', 'easy', 'debutant'].includes(normalized)) return 'easy'
  if (['moyen', 'modere', 'moderate', 'medium', 'intermediaire'].includes(normalized)) return 'medium'
  if (['difficile', 'hard', 'avance'].includes(normalized)) return 'hard'
  if (['expert', 'tres difficile', 'very hard'].includes(normalized)) return 'expert'
  return 'unknown'
}
