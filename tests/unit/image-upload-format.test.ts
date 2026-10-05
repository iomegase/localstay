import { resolveUploadFormat, MAX_IMAGE_UPLOAD_BYTES } from '@/shared/lib/image-upload'

describe('resolveUploadFormat — formats d’upload image owner/admin', () => {
  it('converts png and jpeg/jpg to webp', () => {
    expect(resolveUploadFormat('image/png')).toEqual({ convert: true, contentType: 'image/webp', extension: 'webp' })
    expect(resolveUploadFormat('image/jpeg')).toEqual({ convert: true, contentType: 'image/webp', extension: 'webp' })
    expect(resolveUploadFormat('image/jpg')).toEqual({ convert: true, contentType: 'image/webp', extension: 'webp' })
  })

  it('re-encodes webp and avif to webp too (spec 012 BR-26)', () => {
    expect(resolveUploadFormat('image/webp')).toEqual({ convert: true, contentType: 'image/webp', extension: 'webp' })
    expect(resolveUploadFormat('image/avif')).toEqual({ convert: true, contentType: 'image/webp', extension: 'webp' })
  })

  it('rejects unsupported types', () => {
    expect(resolveUploadFormat('image/gif')).toBeNull()
    expect(resolveUploadFormat('application/pdf')).toBeNull()
    expect(resolveUploadFormat('')).toBeNull()
  })

  it('exposes a 5 MB size limit', () => {
    expect(MAX_IMAGE_UPLOAD_BYTES).toBe(5 * 1024 * 1024)
  })
})
