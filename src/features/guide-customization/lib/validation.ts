import type { ArrivalInstructionInput, PracticalBlockInput } from '../types'
import {
  parseArrivalFacts,
  parseArrivalSubsteps,
  type ArrivalFact,
  type ArrivalStepKind,
  type ArrivalSubstep,
} from '@/features/guide-app/lib/arrival-steps'

const GUIDE_RADIUS_KM = 30

const FEATURED_POI_LIMIT_PER_CATEGORY = 5

/** Limite d'un commentaire de recommandation owner : 300 mots. */
export const OWNER_NOTE_MAX_WORDS = 300

/** Compte les mots d'un texte (séquences séparées par n'importe quel blanc). */
export function countWords(text: string): number {
  const trimmed = text.trim()
  if (trimmed === '') return 0
  return trimmed.split(/\s+/).length
}

export function normalizeOwnerNote(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export interface CategoryOrderFilterResult {
  category_order: string[]
  ignored_category_slugs: string[]
}

export interface PoiGuideScopeInput {
  city_id: string
  lodging_city_id: string
  is_active: boolean
  deleted_at: Date | null
  geocode_status: string
  distance_km: number
}

export interface FeaturedPoiCategoryInput {
  poi_id: string
  category_id: string
}

export function filterValidCategoryOrder(
  requestedSlugs: string[],
  validSlugs: Set<string>,
): CategoryOrderFilterResult {
  const seen = new Set<string>()
  const category_order: string[] = []
  const ignored_category_slugs: string[] = []

  for (const slug of requestedSlugs) {
    if (!validSlugs.has(slug)) {
      ignored_category_slugs.push(slug)
      continue
    }

    if (!seen.has(slug)) {
      category_order.push(slug)
      seen.add(slug)
    }
  }

  return { category_order, ignored_category_slugs }
}

export function isPoiWithinGuideScope(input: PoiGuideScopeInput): boolean {
  if (input.city_id !== input.lodging_city_id) return false
  if (!input.is_active || input.deleted_at !== null) return false
  if (input.geocode_status === 'rejected') return false
  if (input.geocode_status === 'success' && input.distance_km > GUIDE_RADIUS_KM) return false
  return true
}

export function groupFeaturedPoisByCategory(
  featuredPois: FeaturedPoiCategoryInput[],
): Map<string, FeaturedPoiCategoryInput[]> {
  const grouped = new Map<string, FeaturedPoiCategoryInput[]>()

  for (const featuredPoi of featuredPois) {
    const existing = grouped.get(featuredPoi.category_id) ?? []
    existing.push(featuredPoi)
    if (existing.length > FEATURED_POI_LIMIT_PER_CATEGORY) {
      throw new Error('FEATURED_POI_LIMIT_EXCEEDED')
    }
    grouped.set(featuredPoi.category_id, existing)
  }

  return grouped
}

export interface NormalizedPracticalBlock {
  id?: string
  equipment_template_id: string | null
  title: string
  body: string | null
  sort_order: number
}

/**
 * Nettoie et réordonne les blocs « Infos pratiques » personnalisés.
 * - rejette les blocs sans titre (après trim),
 * - trim le titre, nulle le texte vide (icône, photo, vidéo : bibliothèque, spec 096),
 * - réindexe sort_order par la position dans le tableau (l'ordre client fait foi).
 */
export function normalizePracticalBlocks(
  blocks: PracticalBlockInput[] | undefined,
): NormalizedPracticalBlock[] {
  if (!blocks || blocks.length === 0) return []
  const clean = (value: string | null | undefined): string | null =>
    typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
  const persistentId = (value: string | undefined): string | undefined => {
    const id = clean(value)
    return id && !id.startsWith('tmp-') ? id : undefined
  }

  return blocks
    .filter(block => clean(block.title) !== null)
    .map((block, index) => {
      const id = persistentId(block.id)
      return {
        ...(id ? { id } : {}),
        equipment_template_id: clean(block.equipment_template_id),
        title: clean(block.title) as string,
        body: clean(block.body),
        // Spec 096 AC-03-02 : icône, photo et vidéo ne viennent jamais de l'Owner.
        sort_order: index,
      }
    })
}

export interface NormalizedArrivalInstruction {
  id?: string
  title: string | null
  text: string
  video_url: string | null
  photos: string[]
  sort_order: number
  kind: ArrivalStepKind
  tip: string | null
  substeps: ArrivalSubstep[]
  facts: ArrivalFact[]
}

/**
 * Nettoie et réordonne les instructions d'arrivée.
 * - rejette les instructions sans texte (après trim),
 * - trim texte/vidéo, retire les photos vides,
 * - réindexe sort_order par la position (l'ordre client fait foi).
 */
export function normalizeArrivalInstructions(
  instructions: ArrivalInstructionInput[] | undefined,
): NormalizedArrivalInstruction[] {
  if (!instructions || instructions.length === 0) return []
  const clean = (value: string | null | undefined): string | null =>
    typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
  const persistentId = (value: string | undefined): string | undefined => {
    const id = clean(value)
    return id && !id.startsWith('tmp-') ? id : undefined
  }

  return instructions
    // Spec 083 AC-01-04 : le texte est facultatif ; seule une étape entièrement vide est retirée.
    .filter(instruction => arrivalStepHasContent(instruction))
    .map((instruction, index) => {
      const id = persistentId(instruction.id)
      return {
        ...(id ? { id } : {}),
        title: clean(instruction.title),
        text: clean(instruction.text) ?? '',
        video_url: clean(instruction.video_url),
        photos: (instruction.photos ?? [])
          .map(photo => photo.trim())
          .filter(Boolean),
        sort_order: index,
        // Spec 054 AC-05-01 : étapes typées (défaut « custom » pour l'existant).
        kind: instruction.kind ?? 'custom',
        tip: clean(instruction.tip),
        substeps: parseArrivalSubsteps(instruction.substeps),
        facts: parseArrivalFacts(instruction.facts),
      }
    })
}

export const EMPTY_ARRIVAL_STEP_MESSAGE = 'Étape vide : ajoutez un titre, un texte ou une photo.'

/** Spec 083 AC-01-04 : une étape doit contenir au moins un titre, un texte, une photo, une vidéo, une sous-étape ou un repère. */
export function arrivalStepHasContent(step: {
  title?: string | null
  text?: string | null
  photos?: string[] | null
  video_url?: string | null
  substeps?: unknown[] | null
  facts?: unknown[] | null
}): boolean {
  const filled = (value: string | null | undefined) => typeof value === 'string' && value.trim().length > 0
  return filled(step.title) || filled(step.text) || filled(step.video_url)
    || (step.photos ?? []).some(photo => filled(photo))
    || (step.substeps ?? []).length > 0 || (step.facts ?? []).length > 0
}

/** Déplace l'élément `activeId` à la position de `overId` (immutable, identité préservée si no-op). */
export function reorderById<T extends { id?: string }>(
  items: T[],
  activeId: string,
  overId: string,
): T[] {
  const from = items.findIndex(item => item.id === activeId)
  const to = items.findIndex(item => item.id === overId)
  if (from === -1 || to === -1 || from === to) return items
  const next = items.slice()
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}
