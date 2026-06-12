// Backfill one-shot : renseigne Event.slug pour les événements déjà en base.
// Usage : npx tsx prisma/backfill-event-slugs.ts
import { PrismaClient } from '@prisma/client'
import { buildEventSlug } from '../src/features/events-public/lib/event-slug'

const prisma = new PrismaClient()

async function main() {
  const events = await prisma.event.findMany({
    where: { slug: null },
    select: { id: true, title: true, source_id: true },
  })
  console.log(`Backfilling ${events.length} event slug(s)...`)
  for (const e of events) {
    await prisma.event.update({
      where: { id: e.id },
      data: { slug: buildEventSlug(e.title, e.source_id) },
    })
  }
  console.log('Done.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
