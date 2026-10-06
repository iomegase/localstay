type GroupableSubcategory = { name: string; slug: string; sort_order: number }

export type SubcategoryGroup<T> = {
  subcategory: GroupableSubcategory | null
  items: T[]
}

const frenchNameCollator = new Intl.Collator('fr', { sensitivity: 'base' })

/**
 * Spec 065 AC-02-01 / AC-02-03 : un groupe par sous-catégorie dans l'ordre de la
 * taxonomie, les POI sans sous-catégorie en dernier. L'ordre d'entrée (distance)
 * est conservé dans chaque groupe.
 */
export function groupPoisBySubcategory<T extends { subcategory: GroupableSubcategory | null }>(
  items: T[],
): Array<SubcategoryGroup<T>> {
  const groups = new Map<string | null, SubcategoryGroup<T>>()

  for (const item of items) {
    const key = item.subcategory?.slug ?? null
    const group = groups.get(key) ?? { subcategory: item.subcategory, items: [] }
    group.items.push(item)
    groups.set(key, group)
  }

  return [...groups.values()].sort((left, right) => {
    if (!left.subcategory) return 1
    if (!right.subcategory) return -1
    return left.subcategory.sort_order - right.subcategory.sort_order
      || frenchNameCollator.compare(left.subcategory.name, right.subcategory.name)
      || left.subcategory.slug.localeCompare(right.subcategory.slug)
  })
}
