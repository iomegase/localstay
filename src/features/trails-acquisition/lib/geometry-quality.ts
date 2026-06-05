export type TrailReliability = 'reliable' | 'indicative'

/**
 * Public verdict derived from the stored data_quality_status (cheap — no geometry needed).
 * Only a fully-classified "complete" trace is presented as reliable; everything else
 * (incomplete, needs_review, indicative…) is badged as approximate to the end user.
 */
export function reliabilityFromQualityStatus(status: string): TrailReliability {
  return status === 'complete' ? 'reliable' : 'indicative'
}

type Coord = [number, number]

export type GeometryQuality = {
  point_count: number
  total_length_km: number
  max_gap_m: number
  density_per_km: number
  segment_count: number
}

export type TrailQualityStatus = 'complete' | 'incomplete' | 'indicative'

// Tunables — a hiking trace below these is treated as approximate (badged "indicative").
// Calibrate against real data after the reclassify dry-run (see plan 2026-06-05 task B4).
export const MAX_ACCEPTABLE_GAP_M = 350 // straight jump between two consecutive points
export const MIN_DENSITY_PER_KM = 6 // points per km

function haversineM(a: Coord, b: Coord): number {
  const R = 6_371_000
  const lat1 = (a[1] * Math.PI) / 180
  const lat2 = (b[1] * Math.PI) / 180
  const dLat = ((b[1] - a[1]) * Math.PI) / 180
  const dLng = ((b[0] - a[0]) * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function toPairs(values: unknown[]): Coord[] {
  return values.flatMap(p =>
    Array.isArray(p) &&
    typeof p[0] === 'number' &&
    typeof p[1] === 'number' &&
    Number.isFinite(p[0]) &&
    Number.isFinite(p[1])
      ? [[p[0], p[1]] as Coord]
      : [],
  )
}

function segmentsOf(geometry: unknown): Coord[][] {
  if (!geometry || typeof geometry !== 'object') return []
  const g = geometry as { type?: string; coordinates?: unknown }
  if (!Array.isArray(g.coordinates)) return []
  if (g.type === 'LineString') {
    const s = toPairs(g.coordinates)
    return s.length >= 2 ? [s] : []
  }
  if (g.type === 'MultiLineString') {
    return g.coordinates.map(l => (Array.isArray(l) ? toPairs(l) : [])).filter(s => s.length >= 2)
  }
  return []
}

/** Geometric quality metrics, or null when there is no usable line geometry. */
export function assessGeometryQuality(geometry: unknown): GeometryQuality | null {
  const segments = segmentsOf(geometry)
  if (segments.length === 0) return null
  const pointCount = segments.reduce((n, s) => n + s.length, 0)
  if (pointCount < 2) return null

  let totalM = 0
  let maxGap = 0
  for (const seg of segments) {
    for (let i = 1; i < seg.length; i += 1) {
      const d = haversineM(seg[i - 1], seg[i])
      totalM += d
      if (d > maxGap) maxGap = d
    }
  }
  const totalKm = totalM / 1000
  return {
    point_count: pointCount,
    total_length_km: totalKm,
    max_gap_m: maxGap,
    density_per_km: totalKm > 0 ? pointCount / totalKm : pointCount,
    segment_count: segments.length,
  }
}

function hasInheritedRef(sourceRefs: unknown): boolean {
  return Array.isArray(sourceRefs) && sourceRefs.some(r => (r as { type?: string })?.type === 'inherited')
}

/**
 * Persisted status that drives the public reliability badge.
 * - no usable geometry        → 'incomplete'
 * - inherited from another trail, too sparse, or huge straight gaps → 'indicative'
 * - dense, self-sourced trace → 'complete'
 */
export function classifyTrailQuality(input: { geometry: unknown; sourceRefs: unknown }): TrailQualityStatus {
  const q = assessGeometryQuality(input.geometry)
  if (!q) return 'incomplete'
  if (hasInheritedRef(input.sourceRefs)) return 'indicative'
  if (q.max_gap_m > MAX_ACCEPTABLE_GAP_M) return 'indicative'
  if (q.density_per_km < MIN_DENSITY_PER_KM) return 'indicative'
  return 'complete'
}
