function safeDecodeURIComponent(input: string): string {
  try {
    return decodeURIComponent(input)
  } catch {
    return input
  }
}

export function normalizeBlogSlug(input: string): string {
  const cleaned = safeDecodeURIComponent(input)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return cleaned || 'article'
}

export function getBlogSlugCandidates(rawSlug: string): string[] {
  const decoded = safeDecodeURIComponent(rawSlug)

  return Array.from(
    new Set([
      rawSlug,
      decoded,
      encodeURIComponent(decoded),
      normalizeBlogSlug(rawSlug),
      normalizeBlogSlug(decoded),
    ].filter(candidate => candidate.length > 0)),
  )
}

export function buildBlogArticlePath(slug: string): string {
  return `/blog/${encodeURIComponent(slug)}`
}
