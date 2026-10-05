/** Spec 042 AC-09-03 : normalisation déterministe, sans accents inventés. */
export function normalizeEditorialWhitespace(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/gu, ' ')
}

const knownLabels: Readonly<Record<string, string>> = {
  'saint gervais les bains': 'Saint-Gervais-les-Bains',
  'saint nicolas de veroce': 'Saint-Nicolas-de-Véroce',
  'haute savoie': 'Haute-Savoie',
  'auvergne rhone alpes': 'Auvergne-Rhône-Alpes',
  'auvergne rhones alpes': 'Auvergne-Rhône-Alpes',
}

export function normalizeGeographicLabel(value: string): string {
  const clean = normalizeEditorialWhitespace(value)
  const key = clean.normalize('NFD').replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase().replace(/[-–—]+/gu, ' ').replace(/\s+/gu, ' ')
  return knownLabels[key] ?? clean.replace(/^\p{L}/u, letter => letter.toLocaleUpperCase('fr-FR'))
}
