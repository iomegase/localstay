import { createHash } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '@/shared/lib/prisma'
import {
  vercelAnalyticsDrainEventSchema,
  type VercelAnalyticsDrainPayloadInput,
} from '@/features/admin-analytics/schemas'

const LIVE_RETENTION_DAYS = 7
const DAY_IN_MS = 24 * 60 * 60 * 1000

function toNullableString(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null
  return String(value)
}

function toPayloadJson(
  value: unknown,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) return undefined
  if (value === null) return Prisma.JsonNull

  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

function buildDedupeKey(event: ReturnType<typeof vercelAnalyticsDrainEventSchema.parse>): string {
  return createHash('sha256')
    .update(JSON.stringify({
      schema: event.schema,
      eventType: event.eventType,
      eventName: event.eventName ?? null,
      eventData: event.eventData ?? null,
      timestamp: event.timestamp,
      projectId: event.projectId,
      ownerId: event.ownerId ?? null,
      sessionId: event.sessionId ?? null,
      deviceId: event.deviceId ?? null,
      origin: event.origin ?? null,
      path: event.path ?? null,
      referrer: event.referrer ?? null,
    }))
    .digest('hex')
}

async function softDeleteExpiredLiveEvents() {
  const now = new Date()
  const cutoff = new Date(now.getTime() - LIVE_RETENTION_DAYS * DAY_IN_MS)

  await prisma.analyticsVercelLiveEvent.updateMany({
    where: {
      deleted_at: null,
      occurred_at: { lt: cutoff },
    },
    data: {
      deleted_at: now,
    },
  })
}

export async function ingestVercelDrainPayload(
  payload: VercelAnalyticsDrainPayloadInput,
): Promise<{ ingested: number }> {
  const events = (Array.isArray(payload) ? payload : [payload]).map(event =>
    vercelAnalyticsDrainEventSchema.parse(event),
  )

  await softDeleteExpiredLiveEvents()

  await Promise.all(events.map(async event => {
    const dedupeKey = buildDedupeKey(event)

    await prisma.analyticsVercelLiveEvent.upsert({
      where: { dedupe_key: dedupeKey },
      create: {
        dedupe_key: dedupeKey,
        schema_name: event.schema,
        source_event_type: event.eventType,
        event_name: event.eventName ?? null,
        occurred_at: new Date(event.timestamp),
        project_id: event.projectId,
        owner_id: event.ownerId ?? null,
        session_id: toNullableString(event.sessionId),
        device_id: toNullableString(event.deviceId),
        origin: event.origin ?? null,
        page_path: event.path ?? null,
        referrer: event.referrer ?? null,
        payload_json: toPayloadJson(event.eventData),
        deleted_at: null,
      },
      update: {
        deleted_at: null,
      },
    })
  }))

  return { ingested: events.length }
}
