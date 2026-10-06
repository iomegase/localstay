export type ReviewMemoryEntry = {
  google_place_id: string
  kind: string // rejected | excluded
  category_id: string | null
  category_name: string | null
}

/**
 * Spec 071 AC-02-02 / AC-03-02 / BR-02 : écarte les lieux exclus de la ville (toutes
 * catégories) et ceux rejetés pour la catégorie du run. Une exclusion prime.
 */
export function filterByReviewMemory<T extends { google_place_id: string | null }>(
  candidates: T[],
  memories: ReviewMemoryEntry[],
  categoryId: string,
): { kept: T[]; skippedRejected: number; skippedExcluded: number } {
  const excluded = new Set(memories.filter(memory => memory.kind === 'excluded').map(memory => memory.google_place_id))
  const rejected = new Set(
    memories
      .filter(memory => memory.kind === 'rejected' && memory.category_id === categoryId)
      .map(memory => memory.google_place_id),
  )

  const kept: T[] = []
  let skippedRejected = 0
  let skippedExcluded = 0
  for (const candidate of candidates) {
    const placeId = candidate.google_place_id
    if (placeId && excluded.has(placeId)) skippedExcluded += 1
    else if (placeId && rejected.has(placeId)) skippedRejected += 1
    else kept.push(candidate)
  }
  return { kept, skippedRejected, skippedExcluded }
}

/** Spec 071 AC-04-02 : statut mémorisé d'un lieu, pour les badges de la recherche par nom. */
export function memoryStatusFor(
  googlePlaceId: string,
  memories: ReviewMemoryEntry[],
): { kind: 'excluded' | 'rejected'; categories: string[] } | null {
  const forPlace = memories.filter(memory => memory.google_place_id === googlePlaceId)
  if (forPlace.some(memory => memory.kind === 'excluded')) return { kind: 'excluded', categories: [] }
  const rejected = forPlace.filter(memory => memory.kind === 'rejected')
  if (rejected.length === 0) return null
  return { kind: 'rejected', categories: rejected.map(memory => memory.category_name ?? '').filter(Boolean) }
}
