export function normalizeCommuneName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function isInseeCode(value: string): boolean {
  return /^[0-9]{5}$/.test(value.trim())
}

export function communeMatches(
  filter: string,
  event: { communeInsee: string; communeName: string },
): boolean {
  const f = filter.trim()
  if (isInseeCode(f)) return event.communeInsee === f
  return normalizeCommuneName(event.communeName).includes(normalizeCommuneName(f))
}
