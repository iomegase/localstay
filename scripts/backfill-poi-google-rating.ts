import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

type CandidateRow = {
  published_poi_id: string
  google_review_payload: Prisma.JsonValue | null
}

function pickRating(payload: Prisma.JsonValue | null): number | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
  const rating = (payload as Record<string, unknown>).rating
  if (typeof rating !== 'number' || !Number.isFinite(rating) || rating < 0 || rating > 5) return null
  return rating
}

function pickRatingCount(payload: Prisma.JsonValue | null): number | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
  const count = (payload as Record<string, unknown>).userRatingCount
  if (typeof count !== 'number' || !Number.isFinite(count) || count < 0) return null
  return Math.trunc(count)
}

async function main() {
  const apply = process.argv.includes('--apply')

  const targets = await prisma.pointOfInterest.findMany({
    where: {
      is_active: true,
      deleted_at: null,
      OR: [{ rating: null }, { rating_count: 0 }],
      google_place_id: { not: null },
    },
    select: { id: true, name: true, rating: true, rating_count: true },
  })

  console.log(`POI candidats au backfill: ${targets.length}`)

  let updated = 0
  let skippedNoPayload = 0
  let skippedNoData = 0

  for (const poi of targets) {
    const candidate = await prisma.poiAcquisitionCandidate.findFirst({
      where: { published_poi_id: poi.id, deleted_at: null },
      orderBy: { created_at: 'desc' },
      select: { published_poi_id: true, google_review_payload: true },
    }) as CandidateRow | null

    if (!candidate) {
      skippedNoPayload += 1
      continue
    }

    const nextRating = pickRating(candidate.google_review_payload)
    const nextCount = pickRatingCount(candidate.google_review_payload)

    if (nextRating === null && nextCount === null) {
      skippedNoData += 1
      continue
    }

    const patch: { rating?: number; rating_count?: number } = {}
    if (nextRating !== null && poi.rating === null) patch.rating = nextRating
    if (nextCount !== null && poi.rating_count === 0) patch.rating_count = nextCount

    if (Object.keys(patch).length === 0) {
      skippedNoData += 1
      continue
    }

    if (apply) {
      await prisma.pointOfInterest.update({ where: { id: poi.id }, data: patch })
    }
    console.log(
      `${apply ? 'UPDATE' : 'DRY '} ${poi.name.padEnd(40)} ${JSON.stringify(patch)}`,
    )
    updated += 1
  }

  console.log('')
  console.log(`Patch ${apply ? 'appliqué' : '(dry-run)'} : ${updated}`)
  console.log(`Sans candidat associé : ${skippedNoPayload}`)
  console.log(`Sans données Google utilisables : ${skippedNoData}`)
  if (!apply) console.log("\nRelancer avec --apply pour persister.")
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
