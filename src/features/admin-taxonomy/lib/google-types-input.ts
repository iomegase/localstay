// Spec 073 AC-01-01 : saisie des types Google (liste séparée par des virgules).
export function parseGoogleTypesInput(value: string): string[] {
  return [...new Set(value.split(/[,\s]+/).map(type => type.trim().toLowerCase()).filter(Boolean))]
}

export function formatGoogleTypesInput(types: string[]): string {
  return types.join(', ')
}
