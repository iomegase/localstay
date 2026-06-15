import type { BlogArticleStatus } from '../types'

export function isBlogArticlePubliclyVisible(input: {
  status: BlogArticleStatus
  published_at: Date | null
  deleted_at: Date | null
}): boolean {
  return input.status === 'published' && input.published_at !== null && input.deleted_at === null
}
