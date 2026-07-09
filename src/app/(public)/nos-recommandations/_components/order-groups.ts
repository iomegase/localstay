/**
 * Ordonne les groupes de catégories selon l'ordre `category_order` défini par
 * l'hôte dans l'éditeur. Les catégories absentes de `category_order` sont
 * placées à la fin, en conservant leur ordre initial (tri stable).
 */
export function orderGroupsByCategoryOrder<T extends { categorySlug: string }>(
  groups: T[],
  categoryOrder: string[],
): T[] {
  const rank = (slug: string) => {
    const index = categoryOrder.indexOf(slug)
    return index === -1 ? Number.MAX_SAFE_INTEGER : index
  }
  return [...groups].sort((a, b) => rank(a.categorySlug) - rank(b.categorySlug))
}
