import { createHash } from 'node:crypto'

/** Slug lisible : minuscules, sans accents, alphanumérique + tirets. */
export function slugify(input: string): string {
  const cleaned = input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les diacritiques
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return cleaned || 'evenement'
}

/**
 * Slug d'événement = titre slugifié + suffixe court déterministe dérivé du
 * sourceId. Le suffixe garantit l'unicité même quand deux événements partagent
 * le même titre.
 */
export function buildEventSlug(title: string, sourceId: string): string {
  const suffix = createHash('sha1').update(sourceId).digest('hex').slice(0, 6)
  return `${slugify(title)}-${suffix}`
}
