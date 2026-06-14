export function contextualFavoritesPath(citySlug?: string | null): string {
  return citySlug ? `/guide/${citySlug}/mes-favoris` : '/mes-favoris'
}

export function contextualContactPath(citySlug?: string | null): string {
  return citySlug ? `/guide/${citySlug}/contact` : '/contact'
}
