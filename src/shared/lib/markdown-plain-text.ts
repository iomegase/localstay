/**
 * Texte brut d'une description Markdown, pour les usages hors page (meta description, JSON-LD) :
 * pas de « ** », « ## », puces ni liens bruts chez Google (PO 2026-10-08, descriptions en Markdown).
 */
export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/gm, '$1.')
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*([-*_]\s*){3,}$/gm, '')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(\*|_)(.+?)\1/g, '$2')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\.\.(\s|$)/g, '.$1')
    .replace(/\s+/g, ' ')
    .trim()
}
