/**
 * Spec 102 US-02 — complète les randonnées « à revoir » d'une ville : titre complet, départ,
 * destination, tracé calculé, distance, dénivelé, durée, photos (Camptocamp, IGN, ORS, Commons).
 * Dry-run par défaut ; `--apply` pour écrire.
 * Usage : npx tsx --env-file=.env scripts/complete-trail-candidates.ts --city <slug> [--apply]
 */
import { Prisma } from '@prisma/client'
import { completeTrailCandidates } from '@/features/trails-acquisition/services/complete-candidates'
import { prisma } from '@/shared/lib/prisma'

const SELECT = {
  id: true, title: true, primary_source_type: true, source_refs: true, raw_payload: true,
  distance_km: true, elevation_gain_m: true, estimated_duration_min: true, loop_type: true,
  start_latitude: true, start_longitude: true, geometry_geojson: true, geometry_status: true,
  elevation_status: true, metric_source: true,
} as const

async function main() {
  const apply = process.argv.includes('--apply')
  const slug = process.argv[process.argv.indexOf('--city') + 1]
  if (!process.argv.includes('--city') || !slug) throw new Error('Préciser --city <slug>')
  const city = await prisma.city.findFirstOrThrow({ where: { slug, deleted_at: null }, select: { id: true, name: true, latitude: true, longitude: true, tourism_site_url: true } })
  // BR-03 : seulement les randonnées à revoir, non supprimées.
  const rows = await prisma.trailCandidate.findMany({
    where: { city_id: city.id, deleted_at: null, review_status: 'needs_review' },
    orderBy: { title: 'asc' },
    select: SELECT,
  })
  console.log(`${rows.length} randonnées à revoir — ${city.name}`)

  const results = await completeTrailCandidates(rows, city)
  for (const result of results) {
    const road = result.drivingMinutes == null ? '' : ` — départ à ${result.drivingMinutes} min en voiture`
    const zone = `${road}${result.outOfZone ? ' ⚠ HORS ZONE (> 45 min)' : ''}`
    console.log(`\n${result.changes.length ? '+' : '·'} ${result.title}${zone}`)
    for (const change of result.changes) console.log(`    ${change}`)
  }
  const changed = results.filter(result => result.changes.length > 0)
  console.log(`\n${changed.length} randonnée(s) complétée(s), ${results.filter(result => result.outOfZone).length} hors zone.`)

  if (!apply) {
    console.log('Dry-run : rien n’est écrit. Relancer avec --apply.')
    return
  }
  for (const { candidate } of changed) {
    await prisma.trailCandidate.updateMany({
      where: { id: candidate.id, review_status: 'needs_review', deleted_at: null },
      data: {
        title: candidate.title,
        source_refs: candidate.source_refs as Prisma.InputJsonValue,
        raw_payload: (candidate.raw_payload ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        distance_km: candidate.distance_km,
        elevation_gain_m: candidate.elevation_gain_m,
        estimated_duration_min: candidate.estimated_duration_min,
        loop_type: candidate.loop_type,
        start_latitude: candidate.start_latitude,
        start_longitude: candidate.start_longitude,
        geometry_geojson: (candidate.geometry_geojson ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        geometry_status: candidate.geometry_status,
        elevation_status: candidate.elevation_status,
        metric_source: candidate.metric_source,
      },
    })
  }
  console.log('Appliqué.')
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
