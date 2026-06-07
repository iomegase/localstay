import { isDeadPhotoResponse, removeDeadPhotos, belongsToPoi } from '@/features/poi-photos/lib/liveness'

describe('isDeadPhotoResponse', () => {
  it('is alive for a 200 image response', () => {
    expect(isDeadPhotoResponse({ status: 200, contentType: 'image/jpeg' })).toBe(false)
  })
  it('is dead for a 404', () => {
    expect(isDeadPhotoResponse({ status: 404, contentType: 'image/jpeg' })).toBe(true)
  })
  it('is dead for a 200 that is not an image (e.g. an HTML error page)', () => {
    expect(isDeadPhotoResponse({ status: 200, contentType: 'text/html; charset=utf-8' })).toBe(true)
  })
  it('is dead for a 403 (gone / blocked)', () => {
    expect(isDeadPhotoResponse({ status: 403, contentType: 'image/png' })).toBe(true)
  })
  it('is dead when content-type is missing', () => {
    expect(isDeadPhotoResponse({ status: 200, contentType: null })).toBe(true)
  })
})

describe('removeDeadPhotos', () => {
  it('removes only the dead urls, preserving order', () => {
    expect(removeDeadPhotos(['a', 'b', 'c'], ['b'])).toEqual(['a', 'c'])
  })
  it('is a no-op when nothing is dead', () => {
    expect(removeDeadPhotos(['a', 'b'], [])).toEqual(['a', 'b'])
  })
})

describe('belongsToPoi', () => {
  it('is true only for a url already in the photos array', () => {
    expect(belongsToPoi(['a', 'b'], 'a')).toBe(true)
    expect(belongsToPoi(['a', 'b'], 'x')).toBe(false)
  })
})
