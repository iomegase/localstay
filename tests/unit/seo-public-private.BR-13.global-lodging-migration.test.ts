import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const migrationPath = join(
  process.cwd(),
  'prisma/migrations/20260828120000_global_lodging_profile_slug/migration.sql',
)

describe('042 SEO public/private architecture BR-13 global lodging slug migration', () => {
  it('creates the global unique index before dropping the City-scoped protection', () => {
    const migration = readFileSync(migrationPath, 'utf8')
    const createGlobalIndex = 'CREATE UNIQUE INDEX "LodgingPublicProfile_slug_key"'
    const dropCityIndex = 'DROP INDEX IF EXISTS "LodgingPublicProfile_city_id_slug_key"'

    expect(migration).toContain(createGlobalIndex)
    expect(migration).toContain(dropCityIndex)
    expect(migration.indexOf(createGlobalIndex)).toBeLessThan(
      migration.indexOf(dropCityIndex),
    )
  })

  it('uses a non-partial global index and performs no data mutation', () => {
    const migration = readFileSync(migrationPath, 'utf8')

    expect(migration).toContain(
      'CREATE UNIQUE INDEX "LodgingPublicProfile_slug_key" ON "LodgingPublicProfile"("slug");',
    )
    expect(migration).not.toMatch(/\bWHERE\b/i)
    expect(migration).not.toMatch(/\b(?:INSERT|UPDATE|DELETE)\b/i)
  })
})
