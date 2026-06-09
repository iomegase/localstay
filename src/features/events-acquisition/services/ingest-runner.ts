import { prisma } from '@/shared/lib/prisma'
import { fetchEventsNear } from '../lib/datatourisme-client'
import { mapDatatourismeObject } from '../lib/datatourisme-mapper'
import { resolveCommune } from '../lib/commune-geo'
import type { ParsedEvent, RunSummary } from '../types'

const SOURCE = 'datatourisme'
export const DEFAULT_RADIUS_KM = 10

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export async function runEventIngestion(
  params: { communeFilter?: string; radiusKm?: number; source?: 'cron' | 'admin' } = {},
): Promise<RunSummary> {
  const radiusKm = params.radiusKm ?? DEFAULT_RADIUS_KM
  const today = startOfToday()

  // 1) Récupérer les objets bruts selon la cible.
  const raw: unknown[] = []
  if (params.communeFilter) {
    const commune = await resolveCommune(params.communeFilter)
    if (commune) {
      raw.push(...(await fetchEventsNear({ latitude: commune.latitude, longitude: commune.longitude, radiusKm })))
    }
  } else {
    const cities = await prisma.city.findMany({
      where: { insee_code: { not: null }, deleted_at: null, is_active: true },
      select: { latitude: true, longitude: true },
    })
    for (const c of cities) {
      raw.push(...(await fetchEventsNear({ latitude: c.latitude, longitude: c.longitude, radiusKm })))
    }
  }
  const fetched = raw.length

  // 2) Mapper, exclure les terminés, dédupliquer par identifiant source
  //    (les rayons des villes peuvent se chevaucher).
  const byId = new Map<string, ParsedEvent>()
  for (const obj of raw) {
    const ev = mapDatatourismeObject(obj as Record<string, unknown>)
    if (ev && new Date(ev.endDate) >= today) byId.set(ev.sourceId, ev)
  }
  const selected = [...byId.values()]
  const matched = selected.length

  // 3) Lier la City par INSEE (un seul findMany) puis upsert idempotent.
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

  // 4) Suppression définitive des événements terminés.
  const del = await prisma.event.deleteMany({ where: { end_date: { lt: today } } })

  return { fetched, matched, upserted, skipped: fetched - matched, deleted: del.count }
}

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
