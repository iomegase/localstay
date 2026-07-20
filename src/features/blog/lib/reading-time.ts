const BLOG_WORDS_PER_MINUTE = 200

export function estimateBlogReadingMinutes(markdown: string): number {
  const wordCount = markdown.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / BLOG_WORDS_PER_MINUTE))
}
