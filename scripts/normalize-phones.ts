/**
 * Spec 096 AC-05 : convertit une fois les numéros existants au format international (+33…).
 * Idempotent. Simulation par défaut ; `--apply` pour écrire.
 *   npx tsx --env-file=.env.local scripts/normalize-phones.ts [--apply]
 */
import { prisma } from '../src/shared/lib/prisma'
import { normalizePhone } from '../src/shared/lib/phone'
import { normalizeUsefulNumbersText } from '../src/features/guide-customization/lib/useful-numbers'

const apply = process.argv.includes('--apply')

type Change = { table: string; id: string; before: string; after: string | null }

async function main() {
  const changes: Change[] = []
  const collect = (table: string, rows: Array<{ id: string; value: string | null }>, convert: (value: string) => string | null) => {
    for (const row of rows) {
      if (!row.value) continue
      const after = convert(row.value)
      if (after !== row.value) changes.push({ table, id: row.id, before: row.value, after })
    }
  }

  collect('PointOfInterest.phone', (await prisma.pointOfInterest.findMany({ where: { phone: { not: null } }, select: { id: true, phone: true } })).map(r => ({ id: r.id, value: r.phone })), normalizePhone)
  collect('PoiAcquisitionCandidate.phone', (await prisma.poiAcquisitionCandidate.findMany({ where: { phone: { not: null } }, select: { id: true, phone: true } })).map(r => ({ id: r.id, value: r.phone })), normalizePhone)
  collect('MissingPoiRequest.phone', (await prisma.missingPoiRequest.findMany({ where: { phone: { not: null } }, select: { id: true, phone: true } })).map(r => ({ id: r.id, value: r.phone })), normalizePhone)
  collect('Event.phone', (await prisma.event.findMany({ where: { phone: { not: null } }, select: { id: true, phone: true } })).map(r => ({ id: r.id, value: r.phone })), normalizePhone)
  collect('User.phone', (await prisma.user.findMany({ where: { phone: { not: null } }, select: { id: true, phone: true } })).map(r => ({ id: r.id, value: r.phone })), normalizePhone)
  collect('ContactMessage.sender_phone', (await prisma.contactMessage.findMany({ where: { sender_phone: { not: null } }, select: { id: true, sender_phone: true } })).map(r => ({ id: r.id, value: r.sender_phone })), normalizePhone)
  collect('LodgingCustomization.useful_services', (await prisma.lodgingCustomization.findMany({ where: { useful_services: { not: null } }, select: { id: true, useful_services: true } })).map(r => ({ id: r.id, value: r.useful_services })), normalizeUsefulNumbersText)

  const byTable = changes.reduce<Record<string, number>>((acc, change) => ({ ...acc, [change.table]: (acc[change.table] ?? 0) + 1 }), {})
  console.log(apply ? 'APPLICATION' : 'SIMULATION (ajoutez --apply pour écrire)', JSON.stringify(byTable))
  for (const change of changes) console.log(`  ${change.table} ${change.id.slice(0, 8)} : ${JSON.stringify(change.before)} → ${JSON.stringify(change.after)}`)
  if (!apply) return

  for (const change of changes) {
    const [table, field] = change.table.split('.') as [string, string]
    const model = (prisma as unknown as Record<string, { update: (args: unknown) => Promise<unknown> }>)[table.charAt(0).toLowerCase() + table.slice(1)]!
    await model.update({ where: { id: change.id }, data: { [field]: change.after } })
  }
  console.log(`${changes.length} numéro(s) convertis.`)
}

main().catch(error => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
