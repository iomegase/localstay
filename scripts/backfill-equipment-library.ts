/**
 * Spec 095 AC-02-04 — reprise unique : verse les équipements déjà saisis des logements dans la
 * bibliothèque « à valider ». Dry-run par défaut ; `--apply` pour écrire.
 * Usage : npx tsx --env-file=.env.local scripts/backfill-equipment-library.ts [--apply]
 */
import { planEquipmentTemplates } from '@/features/equipment-library/queries/library'
import { prisma } from '@/shared/lib/prisma'

async function main() {
  const apply = process.argv.includes('--apply')
  const blocks = await prisma.lodgingPracticalBlock.findMany({
    where: { deleted_at: null, lodging: { deleted_at: null } },
    orderBy: [{ created_at: 'asc' }],
    select: { lodging_id: true, title: true, icon: true, body: true },
  })
  const known = await prisma.equipmentTemplate.findMany({ select: { title_key: true } })
  const plan = planEquipmentTemplates(
    blocks.map(block => ({ lodgingId: block.lodging_id, title: block.title, icon: block.icon, body: block.body })),
    new Set(known.map(row => row.title_key)),
  )
  console.log(`${blocks.length} équipements saisis, ${known.length} déjà en bibliothèque, ${plan.length} à ajouter « à valider » :`)
  for (const draft of plan) console.log(`  - ${draft.title} (${draft.icon})`)
  if (!apply) {
    console.log('Dry-run : rien n’est écrit. Relancer avec --apply.')
  } else if (plan.length > 0) {
    const { count } = await prisma.equipmentTemplate.createMany({ data: plan, skipDuplicates: true })
    console.log(`${count} ajoutés.`)
  }
  await prisma.$disconnect()
}

main().catch(async error => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
