export type DistanceSource = 'city_center' | 'lodging' | 'user_location'

export function formatDistanceValue(distanceKm: number): string {
  return distanceKm < 1
    ? `${Math.round(distanceKm * 1000)} m`
    : `${distanceKm.toFixed(1)} km`
}

export function formatContextualDistance(
  distanceKm: number,
  source?: DistanceSource | null,
): string {
  const value = formatDistanceValue(distanceKm)

  if (source === 'lodging') return `Situé à ${value} du logement`
  if (source === 'user_location') return `Situé à ${value} de votre position actuelle`
  return `Situé à ${value}`
}
