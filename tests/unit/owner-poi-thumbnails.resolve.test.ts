import { ownerPoiThumbnail } from '@/features/guide-customization/lib/poi-thumbnail'

const base = { photos: [] as string[], category: { slug: 'zzz' }, subcategory: null, fallback_image: null }
const mirror = (url: string) => `https://storage.mystay/${encodeURIComponent(url)}`

describe('vignette « Mes coups de cœur » (PO 2026-10-08)', () => {
  it('photo réelle → copie MyStay (spec 063)', () => {
    expect(ownerPoiThumbnail({ ...base, photos: ['https://maps.test/a.jpg'] }, mirror))
      .toEqual({ photo_url: mirror('https://maps.test/a.jpg'), photo_is_fallback: false })
  })

  it('sans photo → image de la médiathèque, sinon image MyStay (spec 070)', () => {
    expect(ownerPoiThumbnail({ ...base, fallback_image: { url: 'https://cdn.test/media.jpg', deleted_at: null } }, mirror))
      .toEqual({ photo_url: 'https://cdn.test/media.jpg', photo_is_fallback: true })
    expect(ownerPoiThumbnail(base, mirror)).toEqual({ photo_url: '/og-mystay.png', photo_is_fallback: true })
  })
})
