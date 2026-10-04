export const FIXED_DEPARTURE_INSTRUCTIONS = [
  'Déposer vos déchets au point de recyclage indiqué ci-dessous.',
  'Faire la vaisselle ou lancer le lave-vaisselle avant votre départ.',
  'Rassembler le linge de toilette utilisé dans la salle de bain.',
  'Laisser les draps en place sur les lits.',
] as const

export const FIXED_HOUSE_RULES = [
  'Merci de respecter le logement, son mobilier ainsi que le voisinage pendant toute la durée de votre séjour.',
  'Les fêtes et nuisances sonores, notamment entre 22 h et 8 h, ne sont pas autorisées.',
  "Merci d'utiliser les équipements conformément à leur destination et de nous signaler rapidement tout incident ou dommage.",
] as const


/** Titres d'accordéon des règles fixes (spec 054 AC-04-01). */
const HOUSE_RULE_TITLES: Record<string, string> = {
  [FIXED_HOUSE_RULES[0]]: 'Respect du logement',
  [FIXED_HOUSE_RULES[1]]: 'Calme et voisinage',
  [FIXED_HOUSE_RULES[2]]: 'Équipements et incidents',
}

export function houseRuleTitle(rule: string, index: number): string {
  return HOUSE_RULE_TITLES[rule] ?? `Règle ${index + 1}`
}

type FixedMessages = {
  departure: Record<'0' | '1' | '2' | '3', string>
  rules: Record<'0' | '1' | '2', string>
  ruleTitles: Record<'0' | '1' | '2', string>
  ruleN: (index: number) => string
}

/** Spec 061 : consigne de départ fixe traduite ; texte saisi par l'hôte inchangé. */
export function translateFixedDeparture(item: string, fixed: FixedMessages): string {
  const index = (FIXED_DEPARTURE_INSTRUCTIONS as readonly string[]).indexOf(item)
  return index >= 0 ? fixed.departure[String(index) as keyof FixedMessages['departure']] : item
}

/** Spec 061 : règle fixe (titre + texte) traduite ; règle saisie par l'hôte inchangée. */
export function translateFixedRule(rule: string, index: number, fixed: FixedMessages): { title: string; text: string } {
  const fixedIndex = (FIXED_HOUSE_RULES as readonly string[]).indexOf(rule)
  if (fixedIndex < 0) return { title: fixed.ruleN(index + 1), text: rule }
  const key = String(fixedIndex) as keyof FixedMessages['rules']
  return { title: fixed.ruleTitles[key], text: fixed.rules[key] }
}

// Phrase d'intro affichée en en-tête : ignorée si saisie comme première consigne.
const DEPARTURE_INTRO =
  'afin de faciliter la préparation du logement pour les prochains voyageurs, nous vous remercions de bien vouloir'

/** Tâches de la checklist de départ (sans la phrase d'intro). */
export function departureTasks(items: readonly string[]): string[] {
  return items.filter(
    item =>
      item.replace(/\s+/g, ' ').replace(/[\s:]+$/, '').trim().toLowerCase() !== DEPARTURE_INTRO,
  )
}
