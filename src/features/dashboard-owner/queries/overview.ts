import { prisma } from '@/shared/lib/prisma'

type Zone = 'primary' | 'nearby'

interface MetricItem {
  name: string
  clicks: number
}

interface ZoneMetricSet {
  primary: MetricItem[]
  nearby: MetricItem[]
}

export interface OverviewMetrics {
  lodging_count: number
  qr_scans_7d: number
  top_categories: ZoneMetricSet
  top_pois: ZoneMetricSet
}

type PoiForZone = {
  id: string
  name: string
  category_id: string
  latitude: number
  longitude: number
  city: {
    latitude: number
    longitude: number
  }
  category: {
    name: string
  }
}

export async function getOverviewMetrics(ownerId: string): Promise<OverviewMetrics> {
  const lodgings = await prisma.lodging.findMany({
    where: { owner_id: ownerId, deleted_at: null },
    select: { id: true },
  })

  if (lodgings.length === 0) {
    return {
      lodging_count: 0,
      qr_scans_7d: 0,
      top_categories: emptyZoneMetricSet(),
      top_pois: emptyZoneMetricSet(),
    }
  }

  const lodgingIds = lodgings.map(l => l.id)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [qr_scans_7d, categoryEvents, poiEvents] = await Promise.all([
    prisma.analytics.count({
      where: {
        lodging_id: { in: lodgingIds },
        event_type: 'qr_scan',
        created_at: { gte: sevenDaysAgo },
      },
    }),
    prisma.analytics.findMany({
      where: {
        lodging_id: { in: lodgingIds },
        event_type: 'category_click',
        category_id: { not: null },
      },
      select: { category_id: true, poi_id: true },
    }),
    prisma.analytics.findMany({
      where: {
        lodging_id: { in: lodgingIds },
        event_type: 'poi_click',
        poi_id: { not: null },
      },
      select: { poi_id: true },
    }),
  ])

  const poiIds = [
    ...new Set([
      ...categoryEvents.map(event => event.poi_id).filter((id): id is string => id !== null),
      ...poiEvents.map(event => event.poi_id).filter((id): id is string => id !== null),
    ]),
  ]

  const pois: PoiForZone[] = poiIds.length > 0
    ? await prisma.pointOfInterest.findMany({
        where: {
          id: { in: poiIds },
          deleted_at: null,
          is_active: true,
          geocode_status: { not: 'rejected' },
        },
        select: {
          id: true,
          name: true,
          category_id: true,
          latitude: true,
          longitude: true,
          city: { select: { latitude: true, longitude: true } },
          category: { select: { name: true } },
        },
      })
    : []

  const poiById = new Map(pois.map(poi => [poi.id, poi]))
  const top_categories = await buildCategoryMetrics(categoryEvents, poiById)
  const top_pois = buildPoiMetrics(poiEvents, poiById)

  return { lodging_count: lodgings.length, qr_scans_7d, top_categories, top_pois }
}

async function buildCategoryMetrics(
  events: { category_id: string | null; poi_id: string | null }[],
  poiById: Map<string, PoiForZone>,
): Promise<ZoneMetricSet> {
  const counts = zoneCountMaps()
  const categoryNames = new Map<string, string>()

  for (const event of events) {
    if (!event.category_id) continue

    const poi = event.poi_id ? poiById.get(event.poi_id) : undefined
    const zone = poi ? getPoiZone(poi) : 'primary'
    if (!zone) continue

    if (poi) categoryNames.set(event.category_id, poi.category.name)
    counts[zone].set(event.category_id, (counts[zone].get(event.category_id) ?? 0) + 1)
  }

  const unresolvedCategoryIds = [...new Set([
    ...counts.primary.keys(),
    ...counts.nearby.keys(),
  ])].filter(id => !categoryNames.has(id))

  if (unresolvedCategoryIds.length > 0) {
    const categories = await prisma.category.findMany({
      where: { id: { in: unresolvedCategoryIds } },
      select: { id: true, name: true },
    })
    for (const category of categories) {
      categoryNames.set(category.id, category.name)
    }
  }

  return {
    primary: toTopMetrics(counts.primary, categoryNames, 5),
    nearby: toTopMetrics(counts.nearby, categoryNames, 5),
  }
}

function buildPoiMetrics(
  events: { poi_id: string | null }[],
  poiById: Map<string, PoiForZone>,
): ZoneMetricSet {
  const counts = zoneCountMaps()
  const poiNames = new Map<string, string>()

  for (const event of events) {
    if (!event.poi_id) continue
    const poi = poiById.get(event.poi_id)
    if (!poi) continue
    const zone = getPoiZone(poi)
    if (!zone) continue

    poiNames.set(poi.id, poi.name)
    counts[zone].set(poi.id, (counts[zone].get(poi.id) ?? 0) + 1)
  }

  return {
    primary: toTopMetrics(counts.primary, poiNames, 10),
    nearby: toTopMetrics(counts.nearby, poiNames, 10),
  }
}

function toTopMetrics(
  counts: Map<string, number>,
  names: Map<string, string>,
  limit: number,
): MetricItem[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, clicks]) => ({ name: names.get(id) ?? 'Inconnu', clicks }))
}

function zoneCountMaps(): Record<Zone, Map<string, number>> {
  return { primary: new Map(), nearby: new Map() }
}

function emptyZoneMetricSet(): ZoneMetricSet {
  return { primary: [], nearby: [] }
}

function getPoiZone(poi: PoiForZone): Zone | null {
  const distanceKm = haversineKm(
    poi.city.latitude,
    poi.city.longitude,
    poi.latitude,
    poi.longitude,
  )

  if (distanceKm <= 15) return 'primary'
  if (distanceKm <= 30) return 'nearby'
  return null
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusKm = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(value: number): number {
  return value * (Math.PI / 180)
}
