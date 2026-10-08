// Spec 096 : remplacé par `@/shared/lib/phone` (format international unique) ; conservé pour les imports existants.
import { formatPhone, phoneHref } from './phone'

export function formatFrenchPhone(raw: string): string {
  return formatPhone(raw) || raw.trim()
}

export function frenchPhoneHref(raw: string): string {
  return phoneHref(raw) || `tel:${raw.replace(/\s/g, '')}`
}
