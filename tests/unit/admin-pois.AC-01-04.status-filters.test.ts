import {
  buildAdminPoiWhere,
  containsTrailLockedFields,
  getAdminPoiStatus,
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

  it('BR-03: rejects slug edits from PATCH payloads', () => {
    const parsed = parseAdminPoiPatchInput({ name: 'Nouveau nom', slug: 'nouveau-slug' })

    expect(parsed.success).toBe(false)
  })

  it('AC-02-05/BR-16: detects trail-specific fields before generic validation', () => {
    expect(containsTrailLockedFields({ trail_detail: { distance_km: 8 } })).toBe(true)
    expect(containsTrailLockedFields({ distance_km: 8 })).toBe(true)
    expect(containsTrailLockedFields({ name: 'Nom public' })).toBe(false)
  })
})
