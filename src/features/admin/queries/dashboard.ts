import { prisma } from '@/shared/lib/prisma'

export type AdminDatePoint = {
  date: string
  count: number
}

export type AdminPendingClaimRow = {
  id: string
  merchant_email: string
  poi_name: string
  city_name: string
  created_at: string
}

export type AdminOverview = {
  kpis: {
    active_cities: number
    active_pois: number
    active_owners: number
    active_merchants: number
    pending_claims: number
    qr_scans_30d: number
  }
  qr_scans_series: AdminDatePoint[]
  latest_pending_claims: AdminPendingClaimRow[]
  billing_notice: 'Facturation non activée en MVP 2'
}

export type AdminCityStatusLabel = 'active' | 'inactive' | 'needs_enrichment'

export type AdminCityRow = {
  id: string
  name: string
  slug: string
  postal_code: string
  is_active: boolean
  active_poi_count: number
  active_lodging_count: number
  qr_scans_30d: number
  status_label: AdminCityStatusLabel
}

export type AdminUserRole = 'owner' | 'merchant' | 'admin'

export type AdminUserRow = {
  id: string
  email: string
  role: AdminUserRole
  is_active: boolean
  created_at: string
  subscription_status: string | null
  active_lodging_count: number
}

const BILLING_NOTICE = 'Facturation non activée en MVP 2'
const DAY_IN_MS = 24 * 60 * 60 * 1000

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getThirtyDayWindow(now = new Date()): { start: Date; days: string[] } {
  const today = startOfUtcDay(now)
  const start = new Date(today.getTime() - 29 * DAY_IN_MS)
  const days = Array.from({ length: 30 }, (_, index) => toDateKey(new Date(start.getTime() + index * DAY_IN_MS)))
  return { start, days }
}

export function buildAdminQrScanSeries(events: Array<{ created_at: Date }>, now = new Date()): AdminDatePoint[] {
  const { days } = getThirtyDayWindow(now)
  const counts = new Map(days.map(day => [day, 0]))

  for (const event of events) {
    const key = toDateKey(event.created_at)
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return days.map(date => ({ date, count: counts.get(date) ?? 0 }))
}

export function getAdminCityStatusLabel(city: { is_active: boolean; active_poi_count: number }): AdminCityStatusLabel {
  if (!city.is_active) return 'inactive'
  if (city.active_poi_count === 0) return 'needs_enrichment'
  return 'active'
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const { start } = getThirtyDayWindow()

  const [
    activeCities,
    activePois,
    activeOwners,
    activeMerchants,
    pendingClaims,
    qrScans30d,
    qrScanEvents,
    latestClaims,
  ] = await Promise.all([
    prisma.city.count({ where: { is_active: true, deleted_at: null } }),
    prisma.pointOfInterest.count({ where: { is_active: true, deleted_at: null } }),
    prisma.user.count({ where: { role: 'owner', is_active: true, deleted_at: null } }),
    prisma.merchantProfile.count({ where: { status: 'active', deleted_at: null } }),
    prisma.merchantClaim.count({ where: { status: 'pending', deleted_at: null } }),
    prisma.analytics.count({ where: { event_type: 'qr_scan', created_at: { gte: start } } }),
    prisma.analytics.findMany({
      where: { event_type: 'qr_scan', created_at: { gte: start } },
      select: { created_at: true },
      orderBy: { created_at: 'asc' },
    }),
    prisma.merchantClaim.findMany({
      where: { status: 'pending', deleted_at: null },
      orderBy: { created_at: 'desc' },
      take: 5,
      select: {
        id: true,
        created_at: true,
        merchant: { select: { email: true } },
        poi: { select: { name: true, city: { select: { name: true } } } },
      },
    }),
  ])

  return {
    kpis: {
      active_cities: activeCities,
      active_pois: activePois,
      active_owners: activeOwners,
      active_merchants: activeMerchants,
      pending_claims: pendingClaims,
      qr_scans_30d: qrScans30d,
    },
    qr_scans_series: buildAdminQrScanSeries(qrScanEvents),
    latest_pending_claims: latestClaims.map(claim => ({
      id: claim.id,
      merchant_email: claim.merchant.email,
      poi_name: claim.poi.name,
      city_name: claim.poi.city.name,
      created_at: claim.created_at.toISOString(),
    })),
    billing_notice: BILLING_NOTICE,
  }
}

export async function getAdminCities(): Promise<AdminCityRow[]> {
  const { start } = getThirtyDayWindow()
  const cities = await prisma.city.findMany({
    where: { deleted_at: null },
    orderBy: [{ is_active: 'desc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      postal_code: true,
      is_active: true,
    },
  })

  return Promise.all(cities.map(async city => {
    const [activePoiCount, activeLodgingCount, qrScans30d] = await Promise.all([
      prisma.pointOfInterest.count({ where: { city_id: city.id, is_active: true, deleted_at: null } }),
      prisma.lodging.count({ where: { city_id: city.id, is_active: true, deleted_at: null } }),
      prisma.analytics.count({ where: { city_id: city.id, event_type: 'qr_scan', created_at: { gte: start } } }),
    ])

    return {
      id: city.id,
      name: city.name,
      slug: city.slug,
      postal_code: city.postal_code,
      is_active: city.is_active,
      active_poi_count: activePoiCount,
      active_lodging_count: activeLodgingCount,
      qr_scans_30d: qrScans30d,
      status_label: getAdminCityStatusLabel({ is_active: city.is_active, active_poi_count: activePoiCount }),
    }
  }))
}

export async function getAdminUsers(role?: AdminUserRole): Promise<AdminUserRow[]> {
  const users = await prisma.user.findMany({
    where: {
      deleted_at: null,
      ...(role ? { role } : {}),
    },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      email: true,
      role: true,
      is_active: true,
      created_at: true,
      subscriptions: {
        where: { deleted_at: null },
        orderBy: { created_at: 'desc' },
        take: 1,
        select: { status: true },
      },
      _count: {
        select: { lodgings: { where: { deleted_at: null } } },
      },
    },
  })

  return users.map(user => ({
    id: user.id,
    email: user.email,
    role: user.role as AdminUserRole,
    is_active: user.is_active,
    created_at: user.created_at.toISOString(),
    subscription_status: user.subscriptions[0]?.status ?? null,
    active_lodging_count: user._count.lodgings,
  }))
}
