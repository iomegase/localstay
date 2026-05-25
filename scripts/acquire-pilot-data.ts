import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { prisma } from '../src/shared/lib/prisma'
import { createAcquisitionRun } from '../src/features/poi-acquisition/queries/runs'
import { createTrailImportRun } from '../src/features/trails-acquisition/queries/runs'

const DEFAULT_CITY_SLUG = 'saint-gervais-les-bains'
const GENERAL_CATEGORY_SLUGS = [
  'diner',
  'cafes',
  'soin',
  'shopping',
  'culture',
  'loisirs',
  'bars',
  'mobilite',
  'famille',
  'urgences',
] as const

const TRAIL_SOURCE_URLS = [
  'https://www.saintgervais.com/je-minspire/randonnee-toutes-saisons/meilleurs-itineraires-de-randonnee/',
  'https://www.saintgervais.com/je-minspire/randonnee-toutes-saisons/mont-joux-en-passant-par-la-crete-du-mont-darbois-saint-gervais-les-bains-fr-4303981/',
  'https://www.saintgervais.com/je-minspire/randonnee-toutes-saisons/le-nid-daigle-au-depart-de-bionnassay-saint-gervais-les-bains-fr-4304009/',
] as const

type RunSummary = {
  type: 'poi' | 'trail'
  source: string
  id: string
  status: string
  candidate_count: number
  error?: string | null
}

async function main() {
  loadEnvFile('.env')
  loadEnvFile('.env.local')

  const dryRun = process.argv.includes('--dry-run')
  const skipGeneral = process.argv.includes('--skip-general')
  const skipTrails = process.argv.includes('--skip-trails')
  const requestedCategories = readCsvArgValue('--categories')
  const citySlug = readArgValue('--city') ?? DEFAULT_CITY_SLUG
  const city = await prisma.city.findFirst({
    where: { slug: citySlug, is_active: true, deleted_at: null },
    select: { id: true, slug: true, name: true },
  })
  if (!city) throw new Error(`Active city not found: ${citySlug}`)

  const admin = await prisma.user.findFirst({
    where: { role: 'admin', is_active: true, deleted_at: null },
    select: { id: true, email: true },
  })
  if (!admin) throw new Error('Active admin user not found')

  const categorySlugs = requestedCategories.length > 0
    ? requestedCategories
    : [...GENERAL_CATEGORY_SLUGS]

  const categories = skipGeneral ? [] : await prisma.category.findMany({
    where: { slug: { in: categorySlugs }, is_active: true, deleted_at: null },
    select: { id: true, slug: true, name: true },
    orderBy: { sort_order: 'asc' },
  })

  console.log(JSON.stringify({
    mode: dryRun ? 'dry-run' : 'apply',
    city: city.slug,
    admin: admin.email,
    general_categories: categories.map(category => category.slug),
    trail_sources: TRAIL_SOURCE_URLS,
  }, null, 2))

  if (dryRun) {
    console.log('Dry-run only. Re-run without --dry-run to launch acquisition runs.')
    return
  }

  const results: RunSummary[] = []

  for (const category of categories) {
    const run = await createAcquisitionRun({ city_id: city.id, category_id: category.id }, admin.id)
    results.push({
      type: 'poi',
      source: category.slug,
      id: run.id,
      status: run.status,
      candidate_count: run.candidates.length,
      error: run.error,
    })
  }

  if (skipTrails) {
    console.log(JSON.stringify({ results }, null, 2))
    return
  }

  for (const [index, sourceUrl] of TRAIL_SOURCE_URLS.entries()) {
    const run = await createTrailImportRun({
      city_id: city.id,
      source_types: index === 0 ? ['official_website', 'overpass'] : ['official_website'],
      source_url: sourceUrl,
      zone_radius_km: 15,
    }, admin.id)
    results.push({
      type: 'trail',
      source: sourceUrl,
      id: run.id,
      status: run.status,
      candidate_count: run.candidates.length,
      error: run.error,
    })
  }

  console.log(JSON.stringify({ results }, null, 2))
}

function loadEnvFile(fileName: string) {
  const path = resolve(process.cwd(), fileName)
  if (!existsSync(path)) return

  const lines = readFileSync(path, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    const rawValue = trimmed.slice(separatorIndex + 1).trim()
    if (!key || process.env[key] !== undefined) continue

    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '')
  }
}

function readArgValue(name: string): string | null {
  const prefix = `${name}=`
  const arg = process.argv.find(value => value.startsWith(prefix))
  return arg ? arg.slice(prefix.length) : null
}

function readCsvArgValue(name: string): string[] {
  const value = readArgValue(name)
  if (!value) return []
  return value.split(',').map(item => item.trim()).filter(Boolean)
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
