const PUBLIC_CATEGORY_ICON_OVERRIDES: Record<string, string> = {
  alimentation: 'shopping-basket',
  boulangerie: 'croissant',
  cinema: 'popcorn',
  'location-de-ski': 'snowflake',
  'location-de-skis': 'snowflake',
}

function normalizeSlug(value?: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
}

export function getPublicCategoryIconSlug(
  categorySlug: string | null | undefined,
  iconSlug: string | null | undefined,
): string {
  const normalizedCategorySlug = normalizeSlug(categorySlug)
  return PUBLIC_CATEGORY_ICON_OVERRIDES[normalizedCategorySlug] ?? iconSlug ?? 'map-pin'
}
