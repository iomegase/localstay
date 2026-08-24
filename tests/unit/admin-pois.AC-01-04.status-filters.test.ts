import {
  buildAdminPoiWhere,
  containsTrailLockedFields,
  getAdminPoiStatus,
  parseAdminPoiListFilters,
  parseAdminPoiPatchInput,
} from '@/features/admin-pois/lib/admin-poi-rules'

const cityId = '11111111-1111-4111-8111-111111111111'
const categoryId = '22222222-2222-4222-8222-222222222222'
const subcategoryId = '33333333-3333-4333-8333-333333333333'

describe('022 admin POI rules', () => {
  it('AC-04-01/04-02: maps public flags to admin status', () => {
    expect(getAdminPoiStatus({ is_active: true, deleted_at: null })).toBe('active')
    expect(getAdminPoiStatus({ is_active: false, deleted_at: null })).toBe('inactive')
    expect(getAdminPoiStatus({ is_active: false, deleted_at: new Date('2026-05-25T08:00:00.000Z') })).toBe('archived')
    expect(getAdminPoiStatus({ is_active: true, deleted_at: new Date('2026-05-25T08:00:00.000Z') })).toBe('archived')
  })

  it('AC-01-05: excludes archived POIs by default', () => {
    expect(buildAdminPoiWhere({ city_id: cityId })).toEqual({
      city_id: cityId,
      deleted_at: null,
    })
  })

  it('AC-01-02/04-03: builds Prisma filters for archived POIs and secondary filters', () => {
    expect(buildAdminPoiWhere({
      city_id: cityId,
      status: 'archived',
      q: ' brasserie ',
      category_id: categoryId,
      subcategory_id: subcategoryId,
      geocode_status: 'success',
      photo_status: 'with_photos',
      review_source: 'GOOGLE',
    })).toEqual({
      city_id: cityId,
      deleted_at: { not: null },
      category_id: categoryId,
      subcategory_id: subcategoryId,
      geocode_status: 'success',
      review_source: 'GOOGLE',
      photos: { isEmpty: false },
      OR: [
        { name: { contains: 'brasserie', mode: 'insensitive' } },
        { address: { contains: 'brasserie', mode: 'insensitive' } },
      ],
    })
  })

  it('041 AC-04-06: validates and applies the discovery publication filter', () => {
    const parsed = parseAdminPoiListFilters({
      city_id: cityId,
      discovery_status: 'PUBLISHED',
    })

    expect(parsed.success).toBe(true)
    if (!parsed.success) return
    expect(buildAdminPoiWhere(parsed.data)).toEqual({
      city_id: cityId,
      deleted_at: null,
      discovery_status: 'PUBLISHED',
    })
    expect(parseAdminPoiListFilters({
      city_id: cityId,
      discovery_status: 'ARCHIVED',
    }).success).toBe(false)
  })

  it('BR-03: rejects slug edits from PATCH payloads', () => {
    const parsed = parseAdminPoiPatchInput({ name: 'Nouveau nom', slug: 'nouveau-slug' })

    expect(parsed.success).toBe(false)
  })

  it('AC-02-05/BR-16: detects trail-specific fields before generic validation', () => {
    expect(containsTrailLockedFields({ trail_detail: { distance_km: 8 } })).toBe(true)
    expect(containsTrailLockedFields({ distance_km: 8 })).toBe(true)
    expect(containsTrailLockedFields({ name: 'Nom public' })).toBe(false)
  })

  it('allows a constrained trail_metrics patch (the only editable trail values)', () => {
    // La clé dédiée n'est pas verrouillée : elle ne passe pas par le garde-fou métier.
    expect(containsTrailLockedFields({ trail_metrics: { distance_km: 8.4 } })).toBe(false)

    const parsed = parseAdminPoiPatchInput({
      trail_metrics: {
        difficulty: 'medium',
        distance_km: 8.4,
        elevation_gain_m: 950,
        estimated_duration_min: 210,
      },
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects unknown keys and invalid values inside trail_metrics', () => {
    expect(parseAdminPoiPatchInput({ trail_metrics: { foo: 1 } }).success).toBe(false)
    expect(parseAdminPoiPatchInput({ trail_metrics: { distance_km: -3 } }).success).toBe(false)
    expect(parseAdminPoiPatchInput({ trail_metrics: { difficulty: 'extreme' } }).success).toBe(false)
  })
})
