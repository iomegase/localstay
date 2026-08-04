export type UsefulNumberCategory = {
  value: string
  label: string
}

/** Catégories proposées dans le select « Numéros utiles » du formulaire. */
export const USEFUL_NUMBER_CATEGORIES: readonly UsefulNumberCategory[] = [
  { value: 'tourisme', label: 'Office de tourisme' },
  { value: 'mairie', label: 'Mairie' },
  { value: 'medecin', label: 'Médecin' },
  { value: 'pharmacie', label: 'Pharmacie' },
  { value: 'taxi', label: 'Taxi' },
  { value: 'logement', label: 'Contact logement' },
  { value: 'supermarche', label: 'Supermarché' },
  { value: 'autre', label: 'Autre' },
]

const OTHER_CATEGORY = 'autre'

export type UsefulNumberRow = {
  category: string
  /** Libellé libre, utilisé uniquement quand `category === 'autre'`. */
  customLabel: string
  phone: string
}

function presetByValue(value: string): UsefulNumberCategory | undefined {
  return USEFUL_NUMBER_CATEGORIES.find(category => category.value === value)
}

function presetByLabel(label: string): UsefulNumberCategory | undefined {
  return USEFUL_NUMBER_CATEGORIES.find(
    category => category.value !== OTHER_CATEGORY && category.label === label,
  )
}

/** Libellé affiché/stocké pour une ligne (preset ou libre). */
function rowLabel(row: UsefulNumberRow): string {
  if (row.category === OTHER_CATEGORY) return row.customLabel.trim()
  return presetByValue(row.category)?.label.trim() ?? ''
}

/**
 * Sérialise les lignes en texte `Libellé: numéro` (une par ligne), pour la
 * colonne `useful_services`. Les lignes sans libellé ou sans numéro sont
 * ignorées.
 */
export function serializeUsefulNumbers(rows: UsefulNumberRow[]): string {
  return rows
    .map(row => ({ label: rowLabel(row), phone: row.phone.trim() }))
    .filter(entry => entry.label.length > 0 && entry.phone.length > 0)
    .map(entry => `${entry.label}: ${entry.phone}`)
    .join('\n')
}

/**
 * Parse le texte `Libellé: numéro` en lignes éditables. Un libellé connu
 * retrouve sa catégorie preset ; sinon il tombe dans « Autre » en conservant
 * le libellé saisi.
 */
export function parseUsefulNumbers(
  value: string | null | undefined,
): UsefulNumberRow[] {
  if (!value) return []

  return value
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const separator = line.indexOf(':')
      if (separator < 0) return null
      const label = line.slice(0, separator).trim()
      const phone = line.slice(separator + 1).trim()
      if (!label || !phone) return null

      const preset = presetByLabel(label)
      if (preset) {
        return { category: preset.value, customLabel: '', phone }
      }
      return { category: OTHER_CATEGORY, customLabel: label, phone }
    })
    .filter((row): row is UsefulNumberRow => row !== null)
}
