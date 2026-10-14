/**
 * Spec 097 BR-14 / AC-12 — import des 42 activités séminaire du Product Owner :
 * créées non publiées, sans image, prix, prestataire ni attribution. Idempotent.
 * Dry-run par défaut ; `--apply` pour écrire.
 * Usage : npx tsx --env-file=.env.local scripts/import-seminar-activities.ts [--apply]
 */
import { importSeminarActivityCatalog } from '@/features/seminar-activities/services/import-catalog'
import { prisma } from '@/shared/lib/prisma'

async function main() {
  const apply = process.argv.includes('--apply')
  const { created, skipped } = await importSeminarActivityCatalog(undefined, { dryRun: !apply })
  console.log(`${apply ? 'Créées' : 'À créer'} : ${created.length}`)
  created.forEach(title => console.log(`  + ${title}`))
  console.log(`Déjà présentes : ${skipped.length}`)
  if (!apply) console.log('Simulation : relancer avec --apply pour écrire.')
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
