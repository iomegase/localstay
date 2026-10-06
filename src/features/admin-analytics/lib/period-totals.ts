import type { AdminAnalyticsCityRow, AdminAnalyticsPageRow, AdminAnalyticsQueryRow } from '@/features/admin-analytics/types'

// Spec 075 AC-04-01 : les snapshots sont journaliers ; les tableaux affichent un total par période.

function groupBy<T>(rows: T[], key: (row: T) => string): T[][] {
  const groups = new Map<string, T[]>()
  for (const row of rows) {
    const group = groups.get(key(row))
    if (group) group.push(row)
    else groups.set(key(row), [row])
  }
  return [...groups.values()]
}

const sum = <T>(rows: T[], value: (row: T) => number) => rows.reduce((total, row) => total + value(row), 0)

export function totalPageRows(rows: AdminAnalyticsPageRow[], limit: number): AdminAnalyticsPageRow[] {
  return groupBy(rows, row => row.page_path)
    .map(group => ({
      ...group[0]!,
      sessions: sum(group, row => row.sessions),
      seo_clicks: sum(group, row => row.seo_clicks),
      conversions: sum(group, row => row.conversions),
    }))
    .sort((a, b) => b.conversions - a.conversions || b.seo_clicks - a.seo_clicks || b.sessions - a.sessions)
    .slice(0, limit)
}

export function totalQueryRows(rows: AdminAnalyticsQueryRow[], limit: number): AdminAnalyticsQueryRow[] {
  return groupBy(rows, row => row.query)
    .map(group => {
      const clicks = sum(group, row => row.clicks)
      const impressions = sum(group, row => row.impressions)
      const positioned = group.filter(row => row.avg_position !== null && row.impressions > 0)
      const positionWeight = sum(positioned, row => row.impressions)
      const mainPage = [...group].sort((a, b) => b.impressions - a.impressions)[0]!
      return {
        query: mainPage.query,
        page_path: mainPage.page_path,
        city_id: mainPage.city_id,
        city_name: mainPage.city_name,
        clicks,
        impressions,
        ctr: impressions > 0 ? clicks / impressions : null,
        avg_position: positionWeight > 0 ? sum(positioned, row => row.avg_position! * row.impressions) / positionWeight : null,
      }
    })
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
    .slice(0, limit)
}

export function totalCityRows(
  rows: Array<Omit<AdminAnalyticsCityRow, 'top_page_path'>>,
  limit: number,
): Array<Omit<AdminAnalyticsCityRow, 'top_page_path'>> {
  return groupBy(rows, row => row.city_id)
    .map(group => ({
      ...group[0]!,
      sessions: sum(group, row => row.sessions),
      seo_clicks: sum(group, row => row.seo_clicks),
      conversions: sum(group, row => row.conversions),
    }))
    .sort((a, b) => b.seo_clicks - a.seo_clicks || b.sessions - a.sessions)
    .slice(0, limit)
}
