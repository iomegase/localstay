/** Texte d'extrait uniquement ; la source Markdown enregistrée reste intacte (028 AC-02-09). */
export function shortDescriptionText(source: string): string {
  return source
    .replace(/<[^>]*>/g, '')
    .replace(/!?(\[([^\]]*)\])\([^)]*\)/g, '$2')
    .replace(/^\s{0,3}(?:#{1,6}\s+|>\s?|[-+*]\s+|\d+[.)]\s+)/gm, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
