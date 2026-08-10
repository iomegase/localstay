export function formatFrenchPlaceReference(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return ''

  const normalized = trimmed.replace(/\s+/g, ' ')
  const lower = normalized.toLocaleLowerCase('fr-FR')

  if (lower.startsWith('le ')) return `au ${normalized.slice(3).trim()}`
  if (lower.startsWith('la ')) return `à la ${normalized.slice(3).trim()}`
  if (lower.startsWith('les ')) return `aux ${normalized.slice(4).trim()}`
  if (lower.startsWith("l'")) {
    return `à l'${normalized.slice(2)}`
  }
  if (lower.startsWith('l"')) {
    return `à l"${normalized.slice(2)}`
  }
  if (lower.startsWith('l’')) {
    return `à l’${normalized.slice(2)}`
  }

  return `à ${normalized}`
}

export function formatFrenchWelcomeLine(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return 'Bienvenue'

  return `Bienvenue ${formatFrenchPlaceReference(trimmed)}`
}
