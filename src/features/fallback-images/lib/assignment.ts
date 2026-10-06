export type FallbackImageCandidate = {
  id: string
  category_id: string | null
  subcategory_id: string | null
  created_at: Date
}

export type FallbackAssignablePoi = {
  id: string
  city_id: string
  category_id: string
  subcategory_id: string | null
  has_photo: boolean
  fallback_image_id: string | null
}

export type FallbackAssignmentChange = {
  poi_id: string
  fallback_image_id: string | null
}

function byAge(left: FallbackImageCandidate, right: FallbackImageCandidate): number {
  return left.created_at.getTime() - right.created_at.getTime() || left.id.localeCompare(right.id)
}

/**
 * Spec 070 AC-02-01 / BR-01 : images de la sous-catégorie du lieu si elle en a, sinon
 * images classées dans sa catégorie seule.
 */
export function fallbackPool(
  poi: Pick<FallbackAssignablePoi, 'category_id' | 'subcategory_id'>,
  images: FallbackImageCandidate[],
): FallbackImageCandidate[] {
  const ofSubcategory = poi.subcategory_id
    ? images.filter(image => image.subcategory_id === poi.subcategory_id)
    : []
  const pool = ofSubcategory.length > 0
    ? ofSubcategory
    : images.filter(image => image.category_id === poi.category_id && image.subcategory_id === null)
  return [...pool].sort(byAge)
}

/**
 * Spec 070 US-02 : calcule les changements d'attribution pour `targets`, en comptant
 * l'usage par ville (BR-03) des lieux `others`. Une attribution valide est conservée
 * (AC-02-03) ; sinon l'image la moins utilisée de la réserve est choisie (égalité : la
 * plus ancienne). Un lieu avec une vraie photo perd son image (AC-02-05).
 */
export function planFallbackAssignments(
  targets: FallbackAssignablePoi[],
  images: FallbackImageCandidate[],
  others: FallbackAssignablePoi[],
): FallbackAssignmentChange[] {
  const targetIds = new Set(targets.map(target => target.id))
  const usage = new Map<string, number>()
  const usageKey = (cityId: string, imageId: string) => `${cityId}:${imageId}`
  const countUse = (cityId: string, imageId: string, delta: number) => {
    const key = usageKey(cityId, imageId)
    usage.set(key, (usage.get(key) ?? 0) + delta)
  }

  for (const poi of others) {
    if (!targetIds.has(poi.id) && poi.fallback_image_id) countUse(poi.city_id, poi.fallback_image_id, 1)
  }

  const changes: FallbackAssignmentChange[] = []
  // Les attributions valides des lieux traités comptent avant tout nouveau choix.
  const decisions = targets.map(poi => {
    if (poi.has_photo) return { poi, keep: false, pool: [] as FallbackImageCandidate[] }
    const pool = fallbackPool(poi, images)
    const keep = poi.fallback_image_id !== null && pool.some(image => image.id === poi.fallback_image_id)
    if (keep) countUse(poi.city_id, poi.fallback_image_id!, 1)
    return { poi, keep, pool }
  })

  for (const { poi, keep, pool } of decisions) {
    if (keep) continue
    if (poi.has_photo || pool.length === 0) {
      if (poi.fallback_image_id !== null) changes.push({ poi_id: poi.id, fallback_image_id: null })
      continue
    }
    const chosen = pool.reduce((best, image) =>
      (usage.get(usageKey(poi.city_id, image.id)) ?? 0) < (usage.get(usageKey(poi.city_id, best.id)) ?? 0) ? image : best,
    )
    countUse(poi.city_id, chosen.id, 1)
    if (chosen.id !== poi.fallback_image_id) changes.push({ poi_id: poi.id, fallback_image_id: chosen.id })
  }

  return changes
}
