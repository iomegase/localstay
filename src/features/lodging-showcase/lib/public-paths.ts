export function publicLodgingsPath(): '/logements' {
  return '/logements'
}

export function publicLodgingPath(slug: string): string {
  return `${publicLodgingsPath()}/${encodeURIComponent(slug)}`
}
