import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_CITY_SLUG = 'saint-gervais-les-bains'
const LEGACY_CATEGORY_SLUGS = ['restaurants', 'randonnees', 'bien-etre'] as const

type ActivePoi = {
  id: string
  name: string
  slug: string
  category: { slug: string; name: string }
  trail_detail: { id: string; is_active: boolean; deleted_at: Date | null } | null
  merchant_profile: { id: string; status: string; deleted_at: Date | null } | null
  acquisition_candidates_published: Array<{ id: string; review_status: string }>
}

async function main() {
  const apply = process.argv.includes('--apply')
  const citySlug = readArgValue('--city') ?? DEFAULT_CITY_SLUG

  const city = await prisma.city.findFirst({
    where: { slug: citySlug, deleted_at: null },
    select: { id: true, name: true, slug: true },
  })
  if (!city) throw new Error(`City not found: ${citySlug}`)

  const pois = await prisma.pointOfInterest.findMany({
    where: { city_id: city.id, is_active: true, deleted_at: null },
    select: {
      id: true,
      name: true,
      slug: true,
      category: { select: { slug: true, name: true } },
      trail_detail: { select: { id: true, is_active: true, deleted_at: true } },
      merchant_profile: { select: { id: true, status: true, deleted_at: true } },
      acquisition_candidates_published: { select: { id: true, review_status: true } },
    },
    orderBy: { created_at: 'asc' },
  })

  const legacyPois = (pois as ActivePoi[]).filter(shouldSoftDeletePoi)
  const preservedPois = (pois as ActivePoi[]).filter(poi => !shouldSoftDeletePoi(poi))

  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    city: city.slug,
    active_poi_count: pois.length,
    soft_delete_count: legacyPois.length,
    preserved_count: preservedPois.length,
    legacy_categories_to_disable: LEGACY_CATEGORY_SLUGS,
    soft_delete_sample: legacyPois.map(toSummary).slice(0, 50),
    preserved_sample: preservedPois.map(toSummary).slice(0, 50),
  }, null, 2))

  if (!apply) {
    console.log('Dry-run only. Re-run with --apply to write changes.')
    return
  }

  const now = new Date()
  await prisma.$transaction([
    prisma.pointOfInterest.updateMany({
      where: { id: { in: legacyPois.map(poi => poi.id) } },
      data: { is_active: false, deleted_at: now },
    }),
    prisma.category.updateMany({
      where: { slug: { in: [...LEGACY_CATEGORY_SLUGS] }, deleted_at: null },
      data: { is_active: false },
    }),
  ])

  console.log(`Applied cleanup: ${legacyPois.length} POI soft-deleted, legacy categories disabled.`)
}

function shouldSoftDeletePoi(poi: ActivePoi): boolean {
  const activeTrail = poi.trail_detail?.is_active === true && poi.trail_detail.deleted_at === null
  if (activeTrail) return false

  const activeMerchantProfile = poi.merchant_profile?.status === 'active' && poi.merchant_profile.deleted_at === null
  if (activeMerchantProfile) return false

  const publishedByGeneralPipeline = poi.category.slug !== 'rando'
    && poi.acquisition_candidates_published.some(candidate => candidate.review_status === 'published')
  if (publishedByGeneralPipeline) return false

  return true
}

function toSummary(poi: ActivePoi) {
  return {
    name: poi.name,
    slug: poi.slug,
    category: poi.category.slug,
    has_trail_detail: poi.trail_detail !== null,
    published_candidate_count: poi.acquisition_candidates_published
      .filter(candidate => candidate.review_status === 'published')
      .length,
    has_merchant_profile: poi.merchant_profile !== null,
  }
}

function readArgValue(name: string): string | null {
  const prefix = `${name}=`
  const arg = process.argv.find(value => value.startsWith(prefix))
  return arg ? arg.slice(prefix.length) : null
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
