export function publicDiscoveryCityPath(citySlug: string): string {
  return `/decouvrir/${encodeURIComponent(citySlug)}`
}
