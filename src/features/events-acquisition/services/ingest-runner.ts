import { prisma } from '@/shared/lib/prisma'
import { fetchEventsNear, fetchEventDetail } from '../lib/datatourisme-client'
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

  // geo_distance ne sert qu'à *scanner* la zone : on ne garde STRICTEMENT que les
  // événements dont la commune (INSEE) est la commune ciblée — pas les voisines.
  const byId = new Map<string, ParsedEvent>()
  let fetched = 0
  let commune: { insee: string; name: string } | null = null

  const consider = (obj: unknown, allowedInsee: string): void => {
    const ev = mapDatatourismeObject(obj as Record<string, unknown>)
    if (!ev) return
    if (ev.communeInsee !== allowedInsee) return // commune voisine prise dans le rayon → exclue
    if (new Date(ev.endDate) < today) return // événement terminé → exclu
    byId.set(ev.sourceId, ev)
  }

  if (params.communeFilter) {
    const resolved = await resolveCommune(params.communeFilter)
    if (resolved) {
      commune = { insee: resolved.insee, name: resolved.name }
      const objs = await fetchEventsNear({ latitude: resolved.latitude, longitude: resolved.longitude, radiusKm })
      fetched += objs.length
      for (const o of objs) consider(o, resolved.insee)
    }
  } else {
    const cities = await prisma.city.findMany({
      where: { insee_code: { not: null }, deleted_at: null, is_active: true },
      select: { insee_code: true, latitude: true, longitude: true },
    })
    for (const c of cities) {
      if (!c.insee_code) continue
      const objs = await fetchEventsNear({ latitude: c.latitude, longitude: c.longitude, radiusKm })
      fetched += objs.length
      for (const o of objs) consider(o, c.insee_code)
    }
  }

  const selected = [...byId.values()]
  const matched = selected.length

  // Les images (et la description complète) ne sont pas dans la liste : on enrichit
  // chaque event retenu via son détail /v1/catalog/{uuid} (peu de requêtes : seulement
  // les events de la commune ciblée).
  for (const e of selected) {
    try {
      const enriched = mapDatatourismeObject((await fetchEventDetail(e.sourceId)) as Record<string, unknown>)
      if (enriched) {
        e.images = enriched.images
        if (enriched.description) e.description = enriched.description
      }
    } catch {
      // détail indisponible → on garde les données de la liste
    }
  }

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

  return { fetched, matched, upserted, skipped: fetched - matched, deleted: del.count, commune }
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
