import { Prisma } from '@prisma/client'
import { prisma } from '@/shared/lib/prisma'
import { PoiAcquisitionError } from '@/features/poi-acquisition/lib/errors'
import { computeLineDistanceKm, parseGpx } from '@/features/trails-acquisition/lib/gpx-parser'

type SourceRef = { type: string; attribution: string; used_for: string[] }

export type TrailDetailGpxUpdateResult = {
  poi_id: string
  trail_detail_id: string
  points: number
  distance_km: number
  start_latitude: number
  start_longitude: number
}

export async function updateTrailDetailFromGpx(
  poiId: string,
  adminId: string,
  file: { name: string; content: string },
): Promise<TrailDetailGpxUpdateResult> {
  const poi = await prisma.pointOfInterest.findFirst({
    where: { id: poiId, deleted_at: null },
    select: {
      id: true,
      trail_detail: { select: { id: true, distance_km: true, source_refs: true, deleted_at: true } },
    },
  })
  if (!poi) throw new PoiAcquisitionError('POI_NOT_FOUND', 404)
  if (!poi.trail_detail || poi.trail_detail.deleted_at) {
    throw new PoiAcquisitionError('TRAIL_DETAIL_MISSING', 404)
  }

  const parsed = parseGpx(file.content)
  const geometry = { type: 'LineString' as const, coordinates: parsed.coordinates }
  const distanceKm = computeLineDistanceKm(parsed.coordinates)
  const existingRefs = parseSourceRefs(poi.trail_detail.source_refs)
  const nextRefs: SourceRef[] = [
    ...existingRefs.filter(r => r.type !== 'gpx'),
    {
      type: 'gpx',
      attribution: `GPX uploadé manuellement (${file.name})`,
      used_for: ['geometry', 'distance_km'],
    },
  ]

  const result = await prisma.$transaction(async tx => {
    const updated = await tx.trailDetail.update({
      where: { id: poi.trail_detail!.id },
      data: {
        geometry_geojson: geometry as Prisma.InputJsonValue,
        start_latitude: parsed.startLatitude,
        start_longitude: parsed.startLongitude,
        distance_km: poi.trail_detail!.distance_km ?? distanceKm,
        source_refs: nextRefs as Prisma.InputJsonValue,
      },
      select: { id: true, distance_km: true, start_latitude: true, start_longitude: true },
    })

    await tx.poiAcquisitionAuditLog.create({
      data: {
        admin_id: adminId,
        action: 'poi_trail_gpx_uploaded',
        target_type: 'poi',
        target_id: poiId,
        after: {
          trail_detail_id: updated.id,
          points: parsed.coordinates.length,
          distance_km: distanceKm,
          file_name: file.name,
        },
      },
    })

    return updated
  })

  return {
    poi_id: poiId,
    trail_detail_id: result.id,
    points: parsed.coordinates.length,
    distance_km: result.distance_km ?? distanceKm,
    start_latitude: result.start_latitude,
    start_longitude: result.start_longitude,
  }
}

function parseSourceRefs(value: unknown): SourceRef[] {
  if (!Array.isArray(value)) return []
  return value.filter((r): r is SourceRef =>
    typeof r === 'object' && r !== null &&
    typeof (r as Record<string, unknown>).type === 'string' &&
    typeof (r as Record<string, unknown>).attribution === 'string' &&
    Array.isArray((r as Record<string, unknown>).used_for),
  )
}
