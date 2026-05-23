import { prisma } from '@/shared/lib/prisma'

export interface OverviewMetrics {
  lodging_count: number
  qr_scans_7d: number
  top_categories: { name: string; clicks: number }[]
  top_pois: { name: string; clicks: number }[]
}

export async function getOverviewMetrics(ownerId: string): Promise<OverviewMetrics> {
  const lodgings = await prisma.lodging.findMany({
    where: { owner_id: ownerId, deleted_at: null },
    select: { id: true },
  })

  if (lodgings.length === 0) {
    return { lodging_count: 0, qr_scans_7d: 0, top_categories: [], top_pois: [] }
  }

  const lodgingIds = lodgings.map(l => l.id)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const qr_scans_7d = await prisma.analytics.count({
    where: {
      lodging_id: { in: lodgingIds },
      event_type: 'qr_scan',
      created_at: { gte: sevenDaysAgo },
    },
  })

  const categoryEvents = await prisma.analytics.findMany({
    where: {
      lodging_id: { in: lodgingIds },
      event_type: 'category_click',
      category_id: { not: null },
    },
    select: { category_id: true },
  })

  const categoryCount = new Map<string, number>()
  for (const e of categoryEvents) {
    if (e.category_id) {
      categoryCount.set(e.category_id, (categoryCount.get(e.category_id) ?? 0) + 1)
    }
  }
  const topCategoryIds = [...categoryCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  const categories = topCategoryIds.length > 0
    ? await prisma.category.findMany({
        where: { id: { in: topCategoryIds } },
        select: { id: true, name: true },
      })
    : []

  const top_categories = topCategoryIds.map(id => ({
    name: categories.find(c => c.id === id)?.name ?? 'Inconnu',
    clicks: categoryCount.get(id) ?? 0,
  }))

  const poiEvents = await prisma.analytics.findMany({
    where: {
      lodging_id: { in: lodgingIds },
      event_type: 'poi_click',
      poi_id: { not: null },
    },
    select: { poi_id: true },
  })

  const poiCount = new Map<string, number>()
  for (const e of poiEvents) {
    if (e.poi_id) {
      poiCount.set(e.poi_id, (poiCount.get(e.poi_id) ?? 0) + 1)
    }
  }
  const topPoiIds = [...poiCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id)

  const pois = topPoiIds.length > 0
    ? await prisma.pointOfInterest.findMany({
        where: { id: { in: topPoiIds } },
        select: { id: true, name: true },
      })
    : []

  const top_pois = topPoiIds.map(id => ({
    name: pois.find(p => p.id === id)?.name ?? 'Inconnu',
    clicks: poiCount.get(id) ?? 0,
  }))

  return { lodging_count: lodgings.length, qr_scans_7d, top_categories, top_pois }
}
