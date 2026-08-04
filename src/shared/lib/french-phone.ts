/**
 * Renvoie les 9 chiffres du numéro national français (sans le 0/indicatif) si
 * l'entrée est un numéro fixe/mobile FR standard, sinon `null` (codes courts
 * type 112/15, numéros étrangers, texte…).
 */
function frenchNationalDigits(raw: string): string | null {
  const cleaned = raw.replace(/[^\d+]/g, '')

  let rest: string | null = null
  if (cleaned.startsWith('+33')) rest = cleaned.slice(3)
  else if (cleaned.startsWith('0033')) rest = cleaned.slice(4)
  else if (cleaned.startsWith('0') && cleaned.length === 10) rest = cleaned.slice(1)

  return rest && /^\d{9}$/.test(rest) ? rest : null
}

/**
 * Formate un numéro FR standard en `+33 X XX XX XX XX`. Les codes courts
 * (112, 15…) et tout ce qui n'est pas un numéro FR à 10 chiffres sont renvoyés
 * inchangés (juste `trim`).
 */
export function formatFrenchPhone(raw: string): string {
  const national = frenchNationalDigits(raw)
  if (!national) return raw.trim()

  const pairs = national.slice(1).match(/.{2}/g) ?? []
  return `+33 ${national[0]} ${pairs.join(' ')}`
}

/** Construit le lien `tel:` (E.164 pour un numéro FR, brut pour un code court). */
export function frenchPhoneHref(raw: string): string {
  const national = frenchNationalDigits(raw)
  if (national) return `tel:+33${national}`
  return `tel:${raw.replace(/\s/g, '')}`
}
