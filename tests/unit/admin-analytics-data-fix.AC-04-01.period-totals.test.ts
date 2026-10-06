import { totalCityRows, totalPageRows, totalQueryRows } from '@/features/admin-analytics/lib/period-totals'

// Spec 075 AC-04-01 — une ligne par page / requête / ville sur la période.
describe('075 — totaux par période', () => {
  it('pages : sommes, tri conversions puis clics puis sessions, limite', () => {
    const day = (page_path: string, sessions: number, seo_clicks: number, conversions = 0) => ({
      page_path, page_type: 'global', city_id: null, city_name: null, sessions, seo_clicks, conversions,
    })
    const rows = totalPageRows([day('/', 10, 1), day('/', 5, 2), day('/seminaires', 3, 0, 1), day('/concept', 1, 9)], 2)
    expect(rows.map(row => [row.page_path, row.sessions, row.seo_clicks, row.conversions])).toEqual([
      ['/seminaires', 3, 0, 1],
      ['/concept', 1, 9, 0],
    ])
    expect(totalPageRows([day('/', 10, 1), day('/', 5, 2)], 10)).toEqual([expect.objectContaining({ sessions: 15, seo_clicks: 3 })])
  })

  it('requêtes : sommes, CTR recalculé, position pondérée par les impressions, page la plus vue', () => {
    const row = (page_path: string, clicks: number, impressions: number, avg_position: number | null) => ({
      query: 'mystay', page_path, city_id: null, city_name: null, clicks, impressions, ctr: null, avg_position,
    })
    const [total] = totalQueryRows([row('/', 2, 10, 1), row('/concept', 1, 30, 5)], 10)
    expect(total).toEqual({
      query: 'mystay', page_path: '/concept', city_id: null, city_name: null,
      clicks: 3, impressions: 40, ctr: 3 / 40, avg_position: (1 * 10 + 5 * 30) / 40,
    })
  })

  it('requêtes : sans impression → CTR et position nuls', () => {
    const [total] = totalQueryRows([{ query: 'q', page_path: null, city_id: null, city_name: null, clicks: 0, impressions: 0, ctr: null, avg_position: null }], 10)
    expect(total).toMatchObject({ ctr: null, avg_position: null })
  })

  it('villes : sommes par ville, tri clics SEO puis sessions', () => {
    const rows = totalCityRows([
      { city_id: 'a', city_name: 'A', sessions: 1, seo_clicks: 0, conversions: 0 },
      { city_id: 'b', city_name: 'B', sessions: 2, seo_clicks: 1, conversions: 1 },
      { city_id: 'a', city_name: 'A', sessions: 4, seo_clicks: 3, conversions: 2 },
    ], 10)
    expect(rows).toEqual([
      { city_id: 'a', city_name: 'A', sessions: 5, seo_clicks: 3, conversions: 2 },
      { city_id: 'b', city_name: 'B', sessions: 2, seo_clicks: 1, conversions: 1 },
    ])
  })
})
