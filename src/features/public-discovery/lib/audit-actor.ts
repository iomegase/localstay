import { z } from 'zod'

const userAuditActorSchema = z.object({
  type: z.enum(['ADMIN', 'MERCHANT']),
  userId: z.string().min(1),
}).strict()

const systemAuditActorSchema = z.object({
  type: z.literal('SYSTEM'),
}).strict()

const poiDiscoveryAuditActorSchema = z.discriminatedUnion('type', [
  userAuditActorSchema,
  systemAuditActorSchema,
])

export type PoiDiscoveryAuditActor = z.infer<typeof poiDiscoveryAuditActorSchema>

export function parsePoiDiscoveryAuditActor(input: unknown): PoiDiscoveryAuditActor {
  return poiDiscoveryAuditActorSchema.parse(input)
}

export function toPoiDiscoveryAuditActorData(actor: PoiDiscoveryAuditActor): {
  actor_type: PoiDiscoveryAuditActor['type']
  admin_id: string | null
} {
  return actor.type === 'SYSTEM'
    ? { actor_type: 'SYSTEM', admin_id: null }
    : { actor_type: actor.type, admin_id: actor.userId }
}
