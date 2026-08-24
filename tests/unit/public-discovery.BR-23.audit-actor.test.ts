import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  parsePoiDiscoveryAuditActor,
  toPoiDiscoveryAuditActorData,
} from '@/features/public-discovery/lib/audit-actor'

describe('041 BR-23 typed discovery audit actors', () => {
  it.each([
    ['ADMIN', 'admin-1'],
    ['MERCHANT', 'merchant-1'],
  ] as const)('requires a user-backed %s actor', (actorType, userId) => {
    const actor = parsePoiDiscoveryAuditActor({ type: actorType, userId })
    expect(toPoiDiscoveryAuditActorData(actor)).toEqual({
      actor_type: actorType,
      admin_id: userId,
    })
  })

  it('represents an unauthenticated automation as SYSTEM without a User', () => {
    const actor = parsePoiDiscoveryAuditActor({ type: 'SYSTEM' })
    expect(toPoiDiscoveryAuditActorData(actor)).toEqual({
      actor_type: 'SYSTEM',
      admin_id: null,
    })
  })

  it.each([
    { type: 'ADMIN' },
    { type: 'MERCHANT' },
    { type: 'SYSTEM', userId: 'forbidden-user' },
    { type: 'UNKNOWN' },
  ])('rejects an invalid actor shape: %p', input => {
    expect(() => parsePoiDiscoveryAuditActor(input)).toThrow()
  })

  it('migrates existing rows to ADMIN and constrains nullable actor identity', () => {
    const migration = readFileSync(join(
      process.cwd(),
      'prisma/migrations/20260824120000_add_poi_audit_actor/migration.sql',
    ), 'utf8')

    expect(migration).toContain(`CREATE TYPE "PoiAuditActorType" AS ENUM ('ADMIN', 'MERCHANT', 'SYSTEM')`)
    expect(migration).toContain(`ADD COLUMN "actor_type" "PoiAuditActorType"`)
    expect(migration).toContain(`SET "actor_type" = 'ADMIN'`)
    expect(migration).toContain(`ALTER COLUMN "actor_type" SET DEFAULT 'ADMIN'`)
    expect(migration).toContain(`ALTER COLUMN "actor_type" SET NOT NULL`)
    expect(migration).toContain(`ALTER COLUMN "admin_id" DROP NOT NULL`)
    expect(migration).not.toContain(`ON DELETE SET NULL`)
    const schema = readFileSync(join(process.cwd(), 'prisma/schema.prisma'), 'utf8')
    expect(schema).toContain(
      `@relation("PoiAcquisitionAuditLogs", fields: [admin_id], references: [id], onDelete: Restrict)`,
    )
    expect(migration).toContain(`"actor_type" = 'SYSTEM' AND "admin_id" IS NULL`)
    expect(migration).toContain(`"actor_type" IN ('ADMIN', 'MERCHANT') AND "admin_id" IS NOT NULL`)
  })
})
