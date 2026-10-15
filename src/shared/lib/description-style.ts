// Spec 098 BR-01 / BR-02 : descriptions factuelles, sans remplissage (« plus longue sans bullshit »).

/** Formules creuses interdites dans les descriptions générées (liste extensible). */
export const HOLLOW_PHRASES = [
  'incontournable',
  'à ne pas manquer',
  'cadre idyllique',
  'havre de paix',
  'niché',
  'nichée',
  'véritable institution',
  'ravira petits et grands',
  'pour tous les goûts',
  'une expérience unique',
  'ambiance chaleureuse et conviviale',
  'un lieu où l’on se sent bien',
  "un lieu où l'on se sent bien",
  'laissez-vous tenter',
] as const

/** Consigne commune aux générateurs Gemini (AC-02-01). */
export const DESCRIPTION_STYLE_INSTRUCTION =
  'Chaque phrase apporte un fait vérifiable tiré des sources (ce qu’on y mange ou fait, spécialités, lieu, ' +
  'bâtiment, histoire, public, saison, accès). Pas de phrase d’ambiance sans fait, pas de question rhétorique, ' +
  'pas d’appel à l’action (« venez découvrir »), pas de répétition du nom ou de la commune pour allonger. ' +
  // BR-06 : la fiche affiche déjà ces informations, qui changent souvent.
  'Ne cite ni horaires d’ouverture, ni jours d’ouverture, ni prix, ni numéro de téléphone, ni adresse e-mail. ' +
  `N’utilise jamais ces formules creuses : ${HOLLOW_PHRASES.filter(phrase => !phrase.includes("'")).map(phrase => `« ${phrase} »`).join(', ')}, ` +
  '« que vous soyez… ou… ».'

const normalize = (text: string) => text.toLocaleLowerCase('fr-FR').replace(/[’]/g, "'")

/** AC-02-02 : formules creuses présentes dans un texte (pour avertir en relecture). */
export function findHollowPhrases(text: string): string[] {
  const haystack = normalize(text)
  const found = new Set<string>()
  for (const phrase of HOLLOW_PHRASES) {
    const needle = normalize(phrase)
    const pattern = new RegExp(`(^|[^\\p{L}])${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}])`, 'u')
    if (pattern.test(haystack)) found.add(needle)
  }
  if (/que vous soyez .{1,60} ou /u.test(haystack)) found.add('que vous soyez… ou…')
  return [...found]
}
