import { Prisma } from '@prisma/client'
import { prisma } from '@/shared/lib/prisma'
import { refineTrailGeometry } from '../services/refine-geometry'
import { classifyTrailQuality } from '../lib/geometry-quality'

export type RefineBatchResult = {
  processed: number
  refined: number
  skipped: number
}

/**
 * Affine par lot les géométries rando pas encore traitées (geometry_refined_at = null) :
 * snap/densification ORS, sauvegarde du brut, re-classification du data_quality_status.
 * On marque geometry_refined_at même en cas d'échec ORS pour ne pas reboucler indéfiniment.
 * Voir plan 2026-06-05 (Phase C).
 */
export async function refinePendingTrailGeometries(limit = 10): Promise<RefineBatchResult> {
  const pending = await prisma.trailDetail.findMany({
    // On n'affine QUE les tracés non fiables (indicative/incomplete). Les bons tracés OSM denses
    // (data_quality_status = 'complete') sont laissés intacts : les re-router via ORS pourrait
    // les dégrader. Voir plan 2026-06-05 (Phase C).
    where: {
      deleted_at: null,
      geometry_refined_at: null,
      data_quality_status: { not: 'complete' },
      geometry_geojson: { not: Prisma.DbNull },
    },
    orderBy: { updated_at: 'asc' },
    take: limit,
    select: { id: true, geometry_geojson: true, source_refs: true, geometry_raw_geojson: true },
  })

  const now = new Date()
  let refined = 0
  let skipped = 0

  for (const trail of pending) {
    const result = await refineTrailGeometry(trail.geometry_geojson)

    if (!result) {
      // Échec / re-route non fiable : on horodate pour ne pas retraiter en boucle.
      await prisma.$transaction(async tx => {
        await tx.trailDetail.update({ where: { id: trail.id }, data: { geometry_refined_at: now } })
      })
      skipped += 1
      continue
    }

    const existingRefs = Array.isArray(trail.source_refs) ? (trail.source_refs as unknown[]) : []
    const nextRefs = [...existingRefs, result.source_ref]

    const data: Prisma.TrailDetailUpdateInput = {
      geometry_geojson: result.geometry as Prisma.InputJsonValue,
      source_refs: nextRefs as Prisma.InputJsonValue,
      geometry_refined_at: now,
      data_quality_status: classifyTrailQuality({ geometry: result.geometry, sourceRefs: nextRefs }),
    }
    // Sauvegarde du tracé brut une seule fois (rollback possible), sans écraser un backup existant.
    if (trail.geometry_raw_geojson == null) {
      data.geometry_raw_geojson = (trail.geometry_geojson ?? Prisma.JsonNull) as Prisma.InputJsonValue
    }

    await prisma.$transaction(async tx => {
      await tx.trailDetail.update({ where: { id: trail.id }, data })
    })
    refined += 1
  }

  return { processed: pending.length, refined, skipped }
}
