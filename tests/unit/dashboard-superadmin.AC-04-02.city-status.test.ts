import { getAdminCityStatusLabel } from '@/features/admin/queries/dashboard'

describe('016 admin city status', () => {
  it('AC-04-02: marks an active city without active POI as needs_enrichment', () => {
    expect(getAdminCityStatusLabel({ is_active: true, active_poi_count: 0 })).toBe('needs_enrichment')
  })

  it('AC-04-01: marks inactive and enriched cities explicitly', () => {
    expect(getAdminCityStatusLabel({ is_active: false, active_poi_count: 12 })).toBe('inactive')
    expect(getAdminCityStatusLabel({ is_active: true, active_poi_count: 12 })).toBe('active')
  })
})
