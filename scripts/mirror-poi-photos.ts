/**
 * Spec 063 AC-01-05 — reprise initiale : copie toutes les photos tierces des POI
 * publiés, par lots, jusqu'à ce qu'il n'en reste plus.
 * Usage : npx tsx --env-file=.env.local scripts/mirror-poi-photos.ts
 */
import { mirrorPendingPoiPhotos } from '@/features/poi-photos/services/mirror-poi-photos'
import { prisma } from '@/shared/lib/prisma'

async function main() {
  const total = { mirrored: 0, skipped: 0, failed: 0 }
  // L'ordre des POI tourne à chaque lot : on s'arrête quand il ne reste rien à tenter,
  // ou après deux lots de suite sans aucune copie (il ne reste que des échecs).
  let emptyPasses = 0
  for (let pass = 1; pass <= 20; pass += 1) {
    const report = await mirrorPendingPoiPhotos(40)
    total.mirrored += report.mirrored
    total.failed += report.failed
    console.log(`Lot ${pass} : ${report.mirrored} copiées, ${report.failed} en échec`)
    if (report.mirrored + report.failed === 0) break
    emptyPasses = report.mirrored === 0 ? emptyPasses + 1 : 0
    if (emptyPasses >= 2) break
  }
  console.log(`Total : ${total.mirrored} copiées, ${total.failed} en échec`)
  await prisma.$disconnect()
}

main().catch(async error => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
