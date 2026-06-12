import { prisma } from '@/shared/lib/prisma'
import type { EventType } from '@/features/events-acquisition/types'
import type { AgendaListItem, AgendaEventDetail, AgendaTypeFacet } from '../types'
import { buildTypeFacets } from '../lib/event-type-labels'
import { formatEventDate } from '../lib/format-event-date'

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** Condition « événement de cette ville » : lié par city_id OU par INSEE. */
function cityScope(cityId: string, insee: string | null) {
  const or: Array<Record<string, string>> = [{ city_id: cityId }]
  if (insee) or.push({ commune_insee: insee })
  return or
}

async function resolveCity(citySlug: string) {
  return prisma.city.findFirst({
    where: { slug: citySlug, is_active: true, deleted_at: null },
    select: { id: true, insee_code: true, name: true },
  })
}

export interface CityAgenda {
  items: AgendaListItem[]
  facets: AgendaTypeFacet[]
}

export async function getCityAgenda(
  citySlug: string,
  options: { type?: EventType } = {},
): Promise<CityAgenda | null> {
  const city = await resolveCity(citySlug)
  if (!city) return null

  const rows = await prisma.event.findMany({
    where: {
      OR: cityScope(city.id, city.insee_code),
      is_active: true,
      deleted_at: null,
      end_date: { gte: startOfToday() },
    },
    orderBy: { start_date: 'asc' },
    select: {
      id: true, slug: true, title: true, event_types: true,
      start_date: true, end_date: true, venue_name: true,
      commune_name: true, images: true,
    },
  })

  // Les facettes reflètent TOUS les types présents (avant filtrage), pour que
  // l'utilisateur voie les autres types disponibles même après avoir filtré.
  const facets = buildTypeFacets(rows.map((r) => r.event_types as EventType[]))

  const filtered = options.type
    ? rows.filter((r) => (r.event_types as EventType[]).includes(options.type!))
    : rows

  const items: AgendaListItem[] = filtered.map((r) => ({
    id: r.id,
    slug: r.slug ?? r.id, // garde-fou si un slug manque (avant backfill)
    title: r.title,
    dateLabel: formatEventDate(r.start_date, r.end_date),
    types: r.event_types as EventType[],
    venueName: r.venue_name,
    communeName: r.commune_name,
    imageUrl: r.images[0] ?? null,
  }))

  return { items, facets }
}

export async function getEventBySlug(
  citySlug: string,
  eventSlug: string,
): Promise<AgendaEventDetail | null> {
  const city = await resolveCity(citySlug)
  if (!city) return null

  const e = await prisma.event.findFirst({
    where: {
      slug: eventSlug,
      OR: cityScope(city.id, city.insee_code),
      is_active: true,
      deleted_at: null,
      end_date: { gte: startOfToday() },
    },
  })
  if (!e) return null

  return {
    id: e.id,
    slug: e.slug ?? e.id,
    title: e.title,
    description: e.description,
    dateLabel: formatEventDate(e.start_date, e.end_date),
    types: e.event_types as EventType[],
    venueName: e.venue_name,
    address: e.address,
    communeName: e.commune_name,
    images: e.images,
    website: e.website,
    phone: e.phone,
    email: e.email,
    priceInfo: e.price_info,
  }
}

export async function cityHasUpcomingEvents(cityId: string, insee: string | null): Promise<boolean> {
  const count = await prisma.event.count({
    where: {
      OR: cityScope(cityId, insee),
      is_active: true,
      deleted_at: null,
      end_date: { gte: startOfToday() },
    },
  })
  return count > 0
}
