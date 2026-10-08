/**
 * Spec 096 AC-05-01 — reprise : rattache les équipements des logements à la bibliothèque (créée
 * « à valider » si besoin) et donne leur photo aux équipements de bibliothèque qui n'en ont pas.
 * Dry-run par défaut ; `--apply` pour écrire.
 * Usage : npx tsx --env-file=.env.local scripts/link-equipment-library.ts [--apply]
 */
import { planEquipmentLinks } from '@/features/equipment-library/lib/link-plan'
import { prisma } from '@/shared/lib/prisma'

async function main() {
  const apply = process.argv.includes('--apply')
  const blocks = await prisma.lodgingPracticalBlock.findMany({
    where: { deleted_at: null, equipment_template_id: null, lodging: { deleted_at: null } },
    orderBy: { created_at: 'asc' },
    select: { id: true, lodging_id: true, title: true, icon: true, body: true, photo_url: true, video_url: true },
  })
  const templates = await prisma.equipmentTemplate.findMany({
    where: { deleted_at: null },
    select: { id: true, title: true, title_key: true, photo_url: true, video_url: true },
  })
  const plan = planEquipmentLinks(blocks, templates)
  const titleOf = new Map(templates.map(template => [template.id, template.title]))

  console.log(`${blocks.length} équipements de logement non liés, ${templates.length} dans la bibliothèque.`)
  console.log(`À créer « à valider » : ${plan.create.length}`)
  plan.create.forEach(draft => console.log(`  + ${draft.title}${draft.photo_url ? ' (photo)' : ''}`))
  console.log(`Photo / vidéo données à la bibliothèque : ${plan.media.length}`)
  plan.media.forEach(item => console.log(`  ~ ${titleOf.get(item.id)} ← ${item.photo_url ?? '—'}${item.video_url ? ' + vidéo' : ''}`))
  console.log(`Rattachements : ${plan.links.length}`)

  if (!apply) {
    console.log('Dry-run : rien n’est écrit. Relancer avec --apply.')
    return
  }
  await prisma.$transaction(async tx => {
    if (plan.create.length > 0) await tx.equipmentTemplate.createMany({ data: plan.create, skipDuplicates: true })
    for (const item of plan.media) {
      await tx.equipmentTemplate.update({ where: { id: item.id }, data: { photo_url: item.photo_url, video_url: item.video_url } })
    }
    const ids = new Map((await tx.equipmentTemplate.findMany({ select: { id: true, title_key: true } })).map(row => [row.title_key, row.id]))
    for (const link of plan.links) {
      const templateId = ids.get(link.titleKey)
      if (templateId) await tx.lodgingPracticalBlock.update({ where: { id: link.blockId }, data: { equipment_template_id: templateId } })
    }
  })
  const remaining = await prisma.lodgingPracticalBlock.count({ where: { deleted_at: null, equipment_template_id: null } })
  console.log(`Appliqué. Équipements de logement encore non liés : ${remaining}`)
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
