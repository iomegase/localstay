import Link from 'next/link'
import { Flag, FlagTriangleRight, MapPin, Navigation, RotateCcw } from 'lucide-react'
import { isValidTrailGeometry } from '../lib/geo'

interface Props {
  name: string
  geometry: unknown | null
  startLatitude: number | null
  startLongitude: number | null
  startHref: string
}

const STATIC_BASE = 'https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static'
const IMAGE_W = 720
const IMAGE_H = 520
const PITCH = 30
const STROKE_COLOR = '455E4C'
const STROKE_WIDTH = 5
const MAX_GEOMETRY_POINTS = 40

export function TrailPreviewMap({ name, geometry, startLatitude, startLongitude, startHref }: Props) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''
  const validGeometry = isValidTrailGeometry(geometry) ? geometry : null
  const previewSrc = buildStaticUrl(validGeometry, startLatitude, startLongitude, token)
  const endpoints = validGeometry ? extractEndpoints(validGeometry) : null
  const isLoop = endpoints ? haversineMeters(endpoints.start, endpoints.end) <= 50 : false

  return (
    <Link
      href={startHref}
      className="relative block overflow-hidden bg-[#E8E6DF] shadow-sm group focus:outline-none focus:ring-2 focus:ring-[#455E4C] focus:ring-offset-2"
      aria-label={`Démarrer la randonnée ${name}`}
      data-testid="trail-preview-map"
    >
      <div className="relative h-[340px]">
        {previewSrc ? (
          <img
            src={previewSrc}
            alt={`Carte randonnée — ${name}`}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#dfe8d7] to-[#b5c7aa]" />
        )}

        {/* CTA Démarrer flottant */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-[#455E4C] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-xl ring-2 ring-white/40 transition-transform group-active:scale-95">
          <Navigation className="h-4 w-4" />
          Démarrer la rando
        </div>

        {/* Attribution Mapbox */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-white/85 px-2 py-1 text-[9px] font-medium text-[#121212] shadow-sm">
          <MapPin className="h-3 w-3" />
          Mapbox outdoors
        </div>

        {/* Légende discrète (icônes seulement, pas de pills empilés) */}
        {endpoints && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#455E4C] shadow-sm">
            {isLoop ? (
              <>
                <RotateCcw className="h-3 w-3" />
                Boucle
              </>
            ) : (
              <>
                <Flag className="h-3 w-3" />
                <span className="opacity-50">→</span>
                <FlagTriangleRight className="h-3 w-3" />
              </>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

function buildStaticUrl(
  geometry: ReturnType<typeof isValidTrailGeometry> extends true ? unknown : unknown,
  startLat: number | null,
  startLng: number | null,
  token: string,
): string | null {
  if (!token) return null
  if (!geometry) {
    if (startLat === null || startLng === null) return null
    return `${STATIC_BASE}/pin-s+${STROKE_COLOR}(${startLng},${startLat})/${startLng},${startLat},13,0,${PITCH}/${IMAGE_W}x${IMAGE_H}@2x?access_token=${token}`
  }

  const simplified = simplifyGeometry(geometry)
  if (!simplified) return null

  const { coordinates: coords, bbox } = simplified
  const centerLng = (bbox.minLng + bbox.maxLng) / 2
  const centerLat = (bbox.minLat + bbox.maxLat) / 2
  const zoom = computeZoom(bbox)

  const geojsonOverlay = encodeURIComponent(
    JSON.stringify({
      type: 'Feature',
      properties: { stroke: `#${STROKE_COLOR}`, 'stroke-width': STROKE_WIDTH, 'stroke-opacity': 0.95 },
      geometry: { type: 'LineString', coordinates: coords },
    }),
  )

  const overlays = [`geojson(${geojsonOverlay})`]
  const startPoint = coords[0]
  const endPoint = coords[coords.length - 1]
  const isLoop = haversineMeters(
    { latitude: startPoint[1], longitude: startPoint[0] },
    { latitude: endPoint[1], longitude: endPoint[0] },
  ) <= 50

  if (isLoop) {
    overlays.unshift(`pin-s+${STROKE_COLOR}(${startPoint[0]},${startPoint[1]})`)
  } else {
    overlays.unshift(`pin-s+16A34A(${startPoint[0]},${startPoint[1]})`)
    overlays.unshift(`pin-s+1F2937(${endPoint[0]},${endPoint[1]})`)
  }

  const overlay = overlays.join(',')
  const url = `${STATIC_BASE}/${overlay}/${centerLng.toFixed(6)},${centerLat.toFixed(6)},${zoom},0,${PITCH}/${IMAGE_W}x${IMAGE_H}@2x?access_token=${token}`

  // Limite Mapbox Static : ~8192 chars. Si dépassée, fallback simple sans path.
  if (url.length > 7800) {
    return `${STATIC_BASE}/pin-s+${STROKE_COLOR}(${startPoint[0]},${startPoint[1]})/${centerLng},${centerLat},${zoom},0,${PITCH}/${IMAGE_W}x${IMAGE_H}@2x?access_token=${token}`
  }
  return url
}

type BBox = { minLng: number; minLat: number; maxLng: number; maxLat: number }
type Simplified = { coordinates: Array<[number, number]>; bbox: BBox }

function simplifyGeometry(geometry: unknown): Simplified | null {
  const flat = flattenToCoordList(geometry)
  if (flat.length < 2) return null

  const stride = Math.max(1, Math.ceil(flat.length / MAX_GEOMETRY_POINTS))
  const sampled: Array<[number, number]> = []
  for (let i = 0; i < flat.length; i += stride) sampled.push(flat[i])
  if (sampled[sampled.length - 1] !== flat[flat.length - 1]) sampled.push(flat[flat.length - 1])

  const bbox: BBox = sampled.reduce<BBox>(
    (acc, [lng, lat]) => ({
      minLng: Math.min(acc.minLng, lng),
      minLat: Math.min(acc.minLat, lat),
      maxLng: Math.max(acc.maxLng, lng),
      maxLat: Math.max(acc.maxLat, lat),
    }),
    { minLng: 180, minLat: 90, maxLng: -180, maxLat: -90 },
  )

  return { coordinates: sampled, bbox }
}

function flattenToCoordList(geometry: unknown): Array<[number, number]> {
  if (!geometry || typeof geometry !== 'object') return []
  const geo = geometry as { type?: string; coordinates?: unknown }
  if (!Array.isArray(geo.coordinates)) return []
  if (geo.type === 'LineString') return toPairs(geo.coordinates)
  if (geo.type === 'MultiLineString') {
    return geo.coordinates.flatMap(line => (Array.isArray(line) ? toPairs(line) : []))
  }
  return []
}

function toPairs(values: unknown[]): Array<[number, number]> {
  return values.flatMap(p => {
    if (Array.isArray(p) && typeof p[0] === 'number' && typeof p[1] === 'number' && Number.isFinite(p[0]) && Number.isFinite(p[1])) {
      return [[p[0], p[1]] as [number, number]]
    }
    return []
  })
}

function computeZoom(bbox: BBox): number {
  // Heuristique : adapter le zoom à l'étendue de la bbox (lat plus pénalisante en Mercator)
  const lngSpan = bbox.maxLng - bbox.minLng
  const latSpan = bbox.maxLat - bbox.minLat
  const maxSpan = Math.max(lngSpan, latSpan)
  if (maxSpan === 0) return 14
  // ~0.01° ≈ zoom 14, 0.1° ≈ zoom 11, 0.5° ≈ zoom 9, 1° ≈ zoom 8
  if (maxSpan > 0.5) return 9
  if (maxSpan > 0.2) return 10
  if (maxSpan > 0.1) return 11
  if (maxSpan > 0.05) return 12
  if (maxSpan > 0.02) return 13
  return 14
}

function extractEndpoints(geometry: unknown): { start: { latitude: number; longitude: number }; end: { latitude: number; longitude: number } } | null {
  const coords = flattenToCoordList(geometry)
  if (coords.length < 2) return null
  const s = coords[0]
  const e = coords[coords.length - 1]
  return {
    start: { latitude: s[1], longitude: s[0] },
    end: { latitude: e[1], longitude: e[0] },
  }
}

function haversineMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const R = 6_371_000
  const lat1 = (a.latitude * Math.PI) / 180
  const lat2 = (b.latitude * Math.PI) / 180
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}
