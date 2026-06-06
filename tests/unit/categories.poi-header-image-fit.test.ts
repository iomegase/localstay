import { getPoiHeaderImageFit } from '@/features/categories/lib/poi-header-image-fit'

describe('getPoiHeaderImageFit', () => {
  it('uses object-cover for portrait photos', () => {
    expect(getPoiHeaderImageFit({ width: 800, height: 1200 })).toBe('object-cover')
  })

  it('uses object-contain for landscape photos', () => {
    expect(getPoiHeaderImageFit({ width: 1600, height: 900 })).toBe('object-contain')
  })

  it('uses object-cover for square photos and unknown dimensions', () => {
    expect(getPoiHeaderImageFit({ width: 1000, height: 1000 })).toBe('object-cover')
    expect(getPoiHeaderImageFit({ width: 0, height: 1000 })).toBe('object-cover')
    expect(getPoiHeaderImageFit({ width: 1000, height: 0 })).toBe('object-cover')
  })
})
