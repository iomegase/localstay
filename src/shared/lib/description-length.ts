// Spec 093 : longueur des descriptions générées (acquisition POI, assistance, randonnées).

export const DESCRIPTION_MIN_WORDS = 120
export const DESCRIPTION_MAX_WORDS = 300
/** BR-02 : 300 mots en français tiennent dans 2 500 caractères. */
export const DESCRIPTION_MAX_CHARS = 2500
/** PO 2026-10-08 : description rédigée à la main dans l'admin (markdown : titres, listes…). */
export const ADMIN_DESCRIPTION_MAX_CHARS = 5000
export const ADMIN_DESCRIPTION_TOO_LONG = `La description dépasse ${ADMIN_DESCRIPTION_MAX_CHARS.toLocaleString('fr-FR')} caractères.`

/** Consigne commune aux prompts Gemini (AC-01 à AC-03, BR-01). */
export const DESCRIPTION_LENGTH_INSTRUCTION =
  `Vise ${DESCRIPTION_MIN_WORDS} à ${DESCRIPTION_MAX_WORDS} mots en 2 à 3 paragraphes séparés par une ligne vide, ` +
  `jamais plus de ${DESCRIPTION_MAX_WORDS} mots. Si les sources fiables ne suffisent pas, écris moins plutôt que de remplir. ` +
  // PO 2026-10-08 : descriptions proposées en Markdown (rendu sur /decouvrir, le guide et l'admin).
  'Rédige en Markdown : **gras** sur 2 à 4 éléments clés (nom du lieu, spécialité, atout principal) ; ' +
  'si le texte dépasse 150 mots, 1 ou 2 intertitres « ## » courts ; au plus une courte liste à puces « - » pour des faits concrets. ' +
  'Pas de titre « # » (le nom du lieu est déjà le titre de la page), ni tableau, ni lien, ni emoji.'

/** Mots du texte, sans les marqueurs Markdown (#, -, *, **, >). */
export function countWords(text: string): number {
  return text
    .replace(/[*_#>`]+/g, ' ')
    .split(/\s+/)
    .filter(word => /[\p{L}\p{N}]/u.test(word))
    .length
}

/** AC-04 : coupe à la dernière phrase complète qui tient dans `maxWords` (paragraphes conservés). */
export function limitToWords(text: string, maxWords = DESCRIPTION_MAX_WORDS): string {
  const trimmed = text.trim()
  if (countWords(trimmed) <= maxWords) return trimmed
  const sentences = [...new Intl.Segmenter('fr', { granularity: 'sentence' }).segment(trimmed)].map(part => part.segment)
  let kept = ''
  for (const sentence of sentences) {
    if (countWords(kept + sentence) > maxWords) break
    kept += sentence
  }
  // Une première phrase déjà trop longue : coupe au mot, avec points de suspension.
  if (!kept.trim()) return `${trimmed.split(/\s+/).slice(0, maxWords).join(' ')}…`
  return dropTrailingHeading(kept.trim())
}

/** Markdown : un intertitre « ## » laissé seul en fin de texte après la coupe est retiré. */
function dropTrailingHeading(text: string): string {
  const lines = text.split('\n')
  while (lines.length > 1 && (/^\s*#{1,6}\s/.test(lines[lines.length - 1]!) || lines[lines.length - 1]!.trim() === '')) lines.pop()
  return lines.join('\n').trim()
}
