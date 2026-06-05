import { PrismaClient } from '@prisma/client'
import { classifyTrailQuality } from '../src/features/trails-acquisition/lib/geometry-quality'

const prisma = new PrismaClient()

/**
 * Recalcule data_quality_status de tous les TrailDetail publiés à partir de la qualité réelle
 * de leur géométrie (densité, sauts, héritage). Dry-run par défaut ; --apply pour écrire.
 *   npx tsx scripts/reclassify-trail-geometry.ts            (dry-run)
 *   npx tsx scripts/reclassify-trail-geometry.ts --apply    (écrit en base)
 */
async function main() {
  const apply = process.argv.includes('--apply')

  const trails = await prisma.trailDetail.findMany({
    where: { deleted_at: null },
    select: {
      id: true,
      geometry_geojson: true,
      source_refs: true,
      data_quality_status: true,
      poi: { select: { name: true } },
    },
  })

  const transitions: Record<string, number> = {}
  const sample: Array<{ name: string; from: string; to: string }> = []
  let changed = 0

  for (const t of trails) {
    const to = classifyTrailQuality({ geometry: t.geometry_geojson, sourceRefs: t.source_refs })
    if (to === t.data_quality_status) continue
    changed += 1
    const key = `${t.data_quality_status} -> ${to}`
    transitions[key] = (transitions[key] ?? 0) + 1
    if (sample.length < 50) sample.push({ name: t.poi?.name ?? t.id, from: t.data_quality_status, to })
    if (apply) {
      await prisma.trailDetail.update({ where: { id: t.id }, data: { data_quality_status: to } })
    }
  }

  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    total_trails: trails.length,
    changed,
    transitions,
    sample,
  }, null, 2))

  if (!apply) console.log('\nDry-run only. Re-run with --apply to write changes.')
}

main()
  .catch(error => { console.error(error); process.exit(1) })
  .finally(() => prisma.$disconnect())
