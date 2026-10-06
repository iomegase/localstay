// Spec 080 : adresse du logement structurée.

export type LodgingAddressParts = {
  number: string | null
  street: string | null
  postal_code: string | null
  city: string | null
}

const clean = (value: string | null | undefined) => (value ?? '').trim()

/** Spec 080 AC-01-02 : « <numéro> <rue>, <code postal> <ville> » (source du géocodage). */
export function composeLodgingAddress(parts: LodgingAddressParts): string | null {
  const streetLine = [clean(parts.number), clean(parts.street)].filter(Boolean).join(' ')
  const cityLine = [clean(parts.postal_code), clean(parts.city)].filter(Boolean).join(' ')
  const address = [streetLine, cityLine].filter(Boolean).join(', ')
  return address || null
}

const FULL_ADDRESS = /^(\d+\s?(?:bis|ter|quater|[a-z])?)\s+(.+?),?\s+(\d{5})\s+(.+)$/i
const STREET_AND_CITY = /^(.+?),?\s+(\d{5})\s+(.+)$/

/** Spec 080 AC-01-03 : découpage d'une adresse saisie librement (avant la spec). */
export function splitLodgingAddress(address: string | null | undefined): LodgingAddressParts {
  const value = clean(address)
  if (!value) return { number: null, street: null, postal_code: null, city: null }
  const full = value.match(FULL_ADDRESS)
  if (full) return { number: full[1]!.trim(), street: full[2]!.trim(), postal_code: full[3]!, city: full[4]!.trim() }
  const partial = value.match(STREET_AND_CITY)
  if (partial) return { number: null, street: partial[1]!.trim(), postal_code: partial[2]!, city: partial[3]!.trim() }
  return { number: null, street: value, postal_code: null, city: null }
}
