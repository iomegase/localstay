type IgnProfilePoint = {
  z?: number
  alti?: number
  elevation?: number
}

type IgnProfile = {
  points?: IgnProfilePoint[]
  elevations?: IgnProfilePoint[]
}

export function deriveElevationFromIgnProfile(profile: IgnProfile): {
  elevation_gain_m: number | null
  elevation_status: 'valid' | 'missing'
  metric_source: 'ign' | null
} {
  const points = profile.points ?? profile.elevations ?? []
  const elevations = points.map(readElevation).filter((value): value is number => value !== null)
  if (elevations.length < 2) {
    return { elevation_gain_m: null, elevation_status: 'missing', metric_source: null }
  }

  let gain = 0
  for (let index = 1; index < elevations.length; index += 1) {
    const delta = elevations[index] - elevations[index - 1]
    if (delta > 0) gain += delta
  }

  return { elevation_gain_m: Math.round(gain), elevation_status: 'valid', metric_source: 'ign' }
}

function readElevation(point: IgnProfilePoint): number | null {
  const value = point.z ?? point.alti ?? point.elevation
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}
