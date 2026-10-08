import { z } from 'zod'

/**
 * Spec 096 : numéros de téléphone au format international E.164 (`+33450477895`).
 * Numéros courts (15, 112, 3624…) et textes non reconnus conservés tels quels (BR-02).
 */

/** AC-01 / AC-02 : forme stockée. Vide → null. */
export function normalizePhone(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed) return null
  // Format national suisse (« 022 347 03 18 ») : pays ambigu sans indicatif → conservé tel quel.
  if (/^0\d{2}[\s.]\d{3}[\s.]\d{2}[\s.]\d{2}$/.test(trimmed)) return trimmed
  // « +33 (0)4 50… » : le 0 national entre parenthèses n'est pas composé.
  const compact = trimmed.replace(/\(0\)/g, '').replace(/[\s.\-/()]/g, '')
  if (!/^\+?\d+$/.test(compact)) return trimmed

  let international: string | null = null
  if (compact.startsWith('+')) international = compact
  else if (compact.startsWith('00')) international = `+${compact.slice(2)}`
  else if (/^0[1-9]\d{8}$/.test(compact)) international = `+33${compact.slice(1)}`
  else if (/^33[1-9]\d{8}$/.test(compact)) international = `+${compact}`

  if (!international) return compact.length <= 6 ? compact : trimmed
  // « +330450… » (0 national laissé après l'indicatif).
  if (/^\+330[1-9]\d{8}$/.test(international)) international = `+33${international.slice(4)}`
  // Indicatif pays : jamais 0 (« 00000000 » factice reste tel quel).
  return /^\+[1-9]\d{5,14}$/.test(international) ? international : trimmed
}

/** AC-04 : affichage lisible (`+33 4 50 47 78 95`) ; autres numéros tels que stockés. */
export function formatPhone(raw: string | null | undefined): string {
  const phone = normalizePhone(raw)
  if (!phone) return ''
  const french = /^\+33([1-9])(\d{8})$/.exec(phone)
  if (!french) return phone
  return `+33 ${french[1]} ${french[2]!.match(/.{2}/g)!.join(' ')}`
}

/** AC-03 : lien d'appel. */
export function phoneHref(raw: string | null | undefined): string {
  const dialable = normalizePhone(raw)?.replace(/[^\d+]/g, '') ?? ''
  return /\d/.test(dialable) ? `tel:${dialable}` : ''
}


/** BR-01 : champ téléphone saisi → forme stockée (vide → null). */
export const PhoneSchema = z.string().max(60).transform(value => normalizePhone(value))
