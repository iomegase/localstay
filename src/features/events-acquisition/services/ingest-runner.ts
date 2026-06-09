import { prisma } from '@/shared/lib/prisma'
import { fetchFluxObjects } from '../lib/datatourisme-client'
import { mapDatatourismeObject } from '../lib/datatourisme-mapper'
import { communeMatches } from '../lib/commune'
import type { ParsedEvent, RunSummary } from '../types'

const SOURCE = 'datatourisme'

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export async function runEventIngestion(
  params: { communeFilter?: string; source?: 'cron' | 'admin' } = {},
): Promise<RunSummary> {
  const { communeFilter } = params
  const today = startOfToday()
  const objects = await fetchFluxObjects()

  const parsed: ParsedEvent[] = []
  for (const obj of objects) {
    const ev = mapDatatourismeObject(obj as Record<string, unknown>)
    if (ev && new Date(ev.endDate) >= today) parsed.push(ev)
  }
  const fetched = parsed.length

  let selected: ParsedEvent[]
  if (communeFilter) {
    selected = parsed.filter((e) => communeMatches(communeFilter, e))
  } else {
    const targets = await cronTargetInsee()
    selected = parsed.filter((e) => targets.has(e.communeInsee))
  }
  const matched = selected.length

  const cityIdByInsee = await resolveCityIds(selected)

  let upserted = 0
  for (const e of selected) {
    const row = toRow(e, cityIdByInsee.get(e.communeInsee) ?? null)
    await prisma.event.upsert({
      where: { source_source_id: { source: SOURCE, source_id: e.sourceId } },
      create: row,
      update: row,
    })
    upserted++
  }

  const del = await prisma.event.deleteMany({ where: { end_date: { lt: today } } })

  return { fetched, matched, upserted, skipped: fetched - matched, deleted: del.count }
}

async function cronTargetInsee(): Promise<Set<string>> {
  const [events, cities] = await Promise.all([
    prisma.event.findMany({
      where: { deleted_at: null },
      select: { commune_insee: true },
      distinct: ['commune_insee'],
    }),
    prisma.city.findMany({
      where: { insee_code: { not: null } },
      select: { insee_code: true },
    }),
  ])
  const set = new Set<string>()
  for (const e of events) set.add(e.commune_insee)
  for (const c of cities) if (c.insee_code) set.add(c.insee_code)
  return set
}

// Batch-resolve City ids for the selected events' communes (one query, not one
// per event) → Map keyed by INSEE code.
async function resolveCityIds(events: ParsedEvent[]): Promise<Map<string, string>> {
  const insees = [...new Set(events.map((e) => e.communeInsee))]
  if (insees.length === 0) return new Map()
  const cities = await prisma.city.findMany({
    where: { insee_code: { in: insees } },
    select: { id: true, insee_code: true },
  })
  return new Map(cities.flatMap((c) => (c.insee_code ? [[c.insee_code, c.id] as const] : [])))
}

function toRow(e: ParsedEvent, cityId: string | null) {
  return {
    source: SOURCE,
    source_id: e.sourceId,
    source_updated_at: e.sourceUpdatedAt ? new Date(e.sourceUpdatedAt) : null,
    city_id: cityId,
    commune_insee: e.communeInsee,
    commune_name: e.communeName,
    title: e.title,
    description: e.description,
    event_types: e.eventTypes,
    start_date: new Date(e.startDate),
    end_date: new Date(e.endDate),
    is_recurring: e.isRecurring,
    periods: e.periods as unknown as object,
    venue_name: e.venueName,
    address: e.address,
    postal_code: e.postalCode,
    latitude: e.latitude,
    longitude: e.longitude,
    images: e.images,
    website: e.website,
    phone: e.phone,
    email: e.email,
    price_info: e.priceInfo,
    raw_payload: e.raw as object,
  }
}
