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

/**
 * Spec 019 BR-22 : sous-catégorie Rando correspondant à une difficulté canonique.
 * Pas de sous-catégorie « Expert » : `expert` est rangé en « Difficile » (PO 2026-10-18).
 */
const DIFFICULTY_SUBCATEGORY_SLUG: Partial<Record<TrailDifficulty, string>> = {
  easy: 'facile',
  medium: 'moyen',
  hard: 'difficile',
  expert: 'difficile',
}

export function trailDifficultySubcategorySlug(difficulty: string | null | undefined): string | null {
  return DIFFICULTY_SUBCATEGORY_SLUG[normalizeTrailDifficulty(difficulty)] ?? null
}
