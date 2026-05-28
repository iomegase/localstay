import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/shared/lib/prisma'
import { getSessionAdmin } from '@/features/merchant/lib/session'
import { apiError } from '@/features/merchant/lib/responses'
import { computeLineDistanceKm, GpxParseError, parseGpx } from '@/features/trails-acquisition/lib/gpx-parser'

type SourceRef = { type: string; attribution: string; used_for: string[] }

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const { id } = await context.params

  const formData = await req.formData().catch(() => null)
  if (!formData) return apiError('VALIDATION_ERROR', 'Form-data requis avec un champ "gpx"', 400)
  const file = formData.get('gpx')
  if (!(file instanceof File)) return apiError('VALIDATION_ERROR', 'Champ "gpx" manquant', 400)
  if (file.size > 5_000_000) return apiError('VALIDATION_ERROR', 'GPX trop volumineux (max 5 MB)', 400)

  const candidate = await prisma.trailCandidate.findFirst({
    where: { id, deleted_at: null },
    select: { id: true, source_refs: true, distance_km: true },
  })
  if (!candidate) return apiError('NOT_FOUND', 'Candidat introuvable', 404)

  let parsed
  try {
    const content = await file.text()
    parsed = parseGpx(content)
  } catch (error) {
    const message = error instanceof GpxParseError ? error.message : 'GPX illisible'
    return apiError('VALIDATION_ERROR', message, 400)
  }

  const geometry = { type: 'LineString' as const, coordinates: parsed.coordinates }
  const distanceKm = computeLineDistanceKm(parsed.coordinates)
  const existingRefs = parseSourceRefs(candidate.source_refs)
  const uploadRef: SourceRef = {
    type: 'gpx',
    attribution: `GPX uploadé manuellement (${file.name})`,
    used_for: ['geometry', 'distance_km'],
  }
  const nextRefs = [...existingRefs.filter(r => r.type !== 'gpx'), uploadRef]

  const updated = await prisma.$transaction(async tx => {
    const row = await tx.trailCandidate.update({
      where: { id },
      data: {
        geometry_geojson: geometry as Prisma.InputJsonValue,
        geometry_status: 'valid',
        start_latitude: parsed.startLatitude,
        start_longitude: parsed.startLongitude,
        distance_km: candidate.distance_km ?? distanceKm,
        source_refs: nextRefs as Prisma.InputJsonValue,
      },
      select: { id: true, geometry_status: true, distance_km: true },
    })
    await tx.trailAuditLog.create({
      data: {
        admin_id: session.user.id,
        action: 'candidate_gpx_uploaded',
        target_type: 'TrailCandidate',
        target_id: id,
        after: { points: parsed.coordinates.length, distance_km: distanceKm, file_name: file.name },
      },
    })
    return row
  })

  return NextResponse.json({ data: { ...updated, points: parsed.coordinates.length } })
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
