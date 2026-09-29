/** Spec 029: recover serialized line breaks in generated/legacy blog Markdown. */
export function normalizeBlogMarkdown(source: string): string {
  const normalized = source.replace(/\r\n?/g, '\n')
  // Leave code examples intact: a literal \n is meaningful inside backticks.
  const parts = normalized.split(/(`{3,}[\s\S]*?`{3,}|~{3,}[\s\S]*?~{3,}|`+[^`]*`+)/g)
  const prose = parts.filter((_, index) => index % 2 === 0).join('')
  // Existing valid multiline Markdown may deliberately mention escaped text.
  // Only repair a serialized document or clearly escaped structural boundaries.
  if (prose.includes('\n') && !/\\n\\n|\\n#{1,6}\s|\\r\\n/.test(prose)) return normalized
  return parts.map((part, index) => index % 2 === 1 ? part :
    part.replace(/(\\+)(r\\n|[nr])/g, (match: string, slashes: string) => slashes.length === 1 ? '\n' : match),
  ).join('')
}
