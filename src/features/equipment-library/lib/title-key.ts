// Spec 095 AC-02-01 : nom comparé sans casse, accents ni espaces superflus.
export function equipmentTitleKey(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
