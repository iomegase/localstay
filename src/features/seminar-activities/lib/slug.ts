/** Spec 097 : slug stable d'une activité (minuscules, sans accents, tirets). */
export function seminarActivitySlug(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'activite'
}
