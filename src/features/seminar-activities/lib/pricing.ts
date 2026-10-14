// Spec 097 BR-08 à BR-08c : prix internes HT en centimes, TVA unique 20 %, simulateur 1–30.

export const VAT_RATE_PERCENT = 20
export const SIMULATOR_MIN_PARTICIPANTS = 1
export const SIMULATOR_MAX_PARTICIPANTS = 30
export const SIMULATOR_DEFAULT_PARTICIPANTS = 10

/**
 * TTC = HT × 1,2 arrondi au centime. Calcul entier : HT × 120 est pair, donc
 * jamais à mi-chemin entre deux centimes.
 */
export function ttcCents(htCents: number): number {
  return Math.round((htCents * (100 + VAT_RATE_PERCENT)) / 100)
}

export type ActivityPrices = {
  price_per_person_cents: number | null
  price_per_group_cents: number | null
}

/** BR-08c : total = prix/pers. × N + forfait groupe (prix absent = 0). */
export function simulateActivityTotal(prices: ActivityPrices, participants: number): { htCents: number; ttcCents: number } {
  if (!Number.isInteger(participants) || participants < SIMULATOR_MIN_PARTICIPANTS || participants > SIMULATOR_MAX_PARTICIPANTS) {
    throw new RangeError(`Participants hors plage : ${participants}`)
  }
  const htCents = (prices.price_per_person_cents ?? 0) * participants + (prices.price_per_group_cents ?? 0)
  return { htCents, ttcCents: ttcCents(htCents) }
}

const euroFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

export function formatEuros(cents: number): string {
  return euroFormatter.format(cents / 100)
}

/**
 * Saisie admin en euros (« 12,50 », « 12.5 », « 1 200 ») vers centimes.
 * Chaîne vide → null ; saisie invalide → undefined.
 */
export function parseEurosToCents(input: string): number | null | undefined {
  const normalized = input.replace(/\s/g, '').replace(',', '.')
  if (!normalized) return null
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return undefined
  return Math.round(Number(normalized) * 100)
}

/** Centimes vers saisie admin (« 12,50 »). */
export function centsToEurosInput(cents: number | null): string {
  if (cents === null) return ''
  return (cents / 100).toFixed(2).replace('.', ',')
}
