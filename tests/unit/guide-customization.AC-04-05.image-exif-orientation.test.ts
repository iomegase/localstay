import sharp from 'sharp'
import { uploadGuideImage } from '@/shared/lib/image-upload-service'

const mockUpload = jest.fn()
const mockGetPublicUrl = jest.fn()

jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseServer: () => ({
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  }),
}))

function jpegFile(buffer: Buffer): File {
  return new File([buffer], 'iphone-photo.jpg', { type: 'image/jpeg' })
}

describe('guide customization AC-04-05 — EXIF image orientation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUpload.mockResolvedValue({ data: { path: 'lodgings/test/photo.webp' }, error: null })
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.test/photo.webp' } })
  })

  it('applies EXIF orientation to pixels before uploading WebP', async () => {
    const input = await sharp({
      create: { width: 120, height: 240, channels: 3, background: '#ff0000' },
    }).withMetadata({ orientation: 6 }).jpeg().toBuffer()

    await expect(uploadGuideImage(jpegFile(input), 'lodgings/test')).resolves.toEqual({
      ok: true,
      url: 'https://cdn.test/photo.webp',
    })

    const uploaded = mockUpload.mock.calls[0]?.[1] as Buffer
    const metadata = await sharp(uploaded).metadata()
    expect(metadata).toMatchObject({ width: 240, height: 120, format: 'webp' })
    expect(metadata.orientation).toBeUndefined()
  })

  it('keeps the pixel dimensions of a JPEG without EXIF rotation', async () => {
    const input = await sharp({
      create: { width: 120, height: 240, channels: 3, background: '#ff0000' },
    }).jpeg().toBuffer()

    await uploadGuideImage(jpegFile(input), 'lodgings/test')

    const uploaded = mockUpload.mock.calls[0]?.[1] as Buffer
    await expect(sharp(uploaded).metadata()).resolves.toMatchObject({
      width: 120,
      height: 240,
      format: 'webp',
    })
  })
})
