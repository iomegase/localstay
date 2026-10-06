/**
 * Spec 070 AC-04-05 — nettoyage initial des fichiers inutilisés de `guide-photos/pois/`
 * et `guide-photos/lodgings/` (jamais `fallbacks/`). Simulation par défaut.
 * Usage : npx tsx --env-file=.env.local scripts/cleanup-storage.ts [--apply]
 */
import { cleanupUnusedStorageFiles } from '@/features/storage-cleanup/services/weekly-cleanup'
import { prisma } from '@/shared/lib/prisma'

async function main() {
  const apply = process.argv.includes('--apply')
  const report = await cleanupUnusedStorageFiles({ dryRun: !apply })
  console.log(
    `${report.dry_run ? 'Simulation' : 'Nettoyage'} : ${report.scanned} fichiers examinés, ` +
    `${report.deleted} ${report.dry_run ? 'à supprimer' : 'supprimés'}, ` +
    `${(report.bytes_freed / 1048576).toFixed(1)} Mo${report.dry_run ? ' (ajouter --apply pour supprimer)' : ' libérés'}`,
  )
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
