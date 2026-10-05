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

async function image(width: number, height: number, format: 'avif' | 'jpeg' | 'webp'): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: '#3366aa' } })[format]().toBuffer()
}

function file(buffer: Buffer, type: string): File {
  return new File([buffer], 'photo', { type })
}

function uploaded(): { path: string; body: Buffer; options: { contentType: string } } {
  const [path, body, options] = mockUpload.mock.calls[0] as [string, Buffer, { contentType: string }]
  return { path, body, options }
}

describe('guide customization AC-04-07 / BR-26 — stored uploads are WebP ≤ 2560 px', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUpload.mockImplementation(async (path: string) => ({ data: { path }, error: null }))
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.test/photo.webp' } })
  })

  it('converts an AVIF upload to WebP', async () => {
    await expect(uploadGuideImage(file(await image(800, 600, 'avif'), 'image/avif'), 'lodgings/x')).resolves.toMatchObject({ ok: true })

    const { path, body, options } = uploaded()
    expect(path).toMatch(/\.webp$/)
    expect(options.contentType).toBe('image/webp')
    await expect(sharp(body).metadata()).resolves.toMatchObject({ format: 'webp', width: 800, height: 600 })
  })

  it('shrinks a large image so its longest side is 2560 px', async () => {
    await uploadGuideImage(file(await image(4000, 3000, 'jpeg'), 'image/jpeg'), 'lodgings/x')

    await expect(sharp(uploaded().body).metadata()).resolves.toMatchObject({ format: 'webp', width: 2560, height: 1920 })
  })

  it('shrinks a large WebP upload as well', async () => {
    await uploadGuideImage(file(await image(3000, 4000, 'webp'), 'image/webp'), 'lodgings/x')

    await expect(sharp(uploaded().body).metadata()).resolves.toMatchObject({ format: 'webp', width: 1920, height: 2560 })
  })

  it('never enlarges a small image', async () => {
    await uploadGuideImage(file(await image(300, 200, 'jpeg'), 'image/jpeg'), 'lodgings/x')

    await expect(sharp(uploaded().body).metadata()).resolves.toMatchObject({ width: 300, height: 200 })
  })
})
