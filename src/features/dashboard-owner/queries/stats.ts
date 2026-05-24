import { prisma } from '@/shared/lib/prisma'

export interface DashboardStats {
  scans_by_day: { date: string; count: number }[]
  top_categories: { name: string; clicks: number }[]
  top_pois: { name: string; clicks: number }[]
}

export async function getDashboardStats(ownerId: string, days: number): Promise<DashboardStats> {
  const lodgings = await prisma.lodging.findMany({
    where: { owner_id: ownerId, deleted_at: null },
    select: { id: true },
  })

  const empty: DashboardStats = {
    scans_by_day: buildEmptyDays(days),
    top_categories: [],
    top_pois: [],
  }

  if (lodgings.length === 0) return empty

  const lodgingIds = lodgings.map(l => l.id)
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const [scanEvents, categoryEvents, poiEvents] = await Promise.all([
    prisma.analytics.findMany({
      where: { lodging_id: { in: lodgingIds }, event_type: 'qr_scan', created_at: { gte: startDate } },
      select: { created_at: true, category_id: true, poi_id: true },
    }),
    prisma.analytics.findMany({
      where: { lodging_id: { in: lodgingIds }, event_type: 'category_click', category_id: { not: null }, created_at: { gte: startDate } },
      select: { category_id: true, created_at: true, poi_id: true },
    }),
    prisma.analytics.findMany({
      where: { lodging_id: { in: lodgingIds }, event_type: 'poi_click', poi_id: { not: null }, created_at: { gte: startDate } },
      select: { poi_id: true, created_at: true, category_id: true },
    }),
  ])

  const scansByDate = new Map<string, number>()
  for (const e of scanEvents) {
    const date = e.created_at.toISOString().split('T')[0]
    scansByDate.set(date, (scansByDate.get(date) ?? 0) + 1)
  }
  const scans_by_day = buildEmptyDays(days).map(d => ({
    date: d.date,
    count: scansByDate.get(d.date) ?? 0,
  }))

  const categoryCount = new Map<string, number>()
  for (const e of categoryEvents) {
    if (e.category_id) categoryCount.set(e.category_id, (categoryCount.get(e.category_id) ?? 0) + 1)
  }
  const topCategoryIds = [...categoryCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id)
  const categories = topCategoryIds.length > 0
    ? await prisma.category.findMany({ where: { id: { in: topCategoryIds } }, select: { id: true, name: true } })
    : []
  const top_categories = topCategoryIds.map(id => ({
    name: categories.find(c => c.id === id)?.name ?? 'Inconnu',
    clicks: categoryCount.get(id) ?? 0,
  }))

  const poiCount = new Map<string, number>()
  for (const e of poiEvents) {
    if (e.poi_id) poiCount.set(e.poi_id, (poiCount.get(e.poi_id) ?? 0) + 1)
  }
  const topPoiIds = [...poiCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => id)
  const pois = topPoiIds.length > 0
    ? await prisma.pointOfInterest.findMany({ where: { id: { in: topPoiIds } }, select: { id: true, name: true } })
    : []
  const top_pois = topPoiIds.map(id => ({
    name: pois.find(p => p.id === id)?.name ?? 'Inconnu',
    clicks: poiCount.get(id) ?? 0,
  }))

  return { scans_by_day, top_categories, top_pois }
}

function buildEmptyDays(days: number): { date: string; count: number }[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000)
    return { date: d.toISOString().split('T')[0], count: 0 }
  })
}
