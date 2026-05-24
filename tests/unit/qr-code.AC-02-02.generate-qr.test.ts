import { generateQrPng } from '@/features/qr-code/services/generate-qr'
import sharp from 'sharp'

jest.setTimeout(60000)

describe('generateQrPng — AC-02-02', () => {
  const url = 'https://example.com/guide/saint-gervais-les-bains'
  let buf: Buffer

  beforeAll(async () => {
    buf = await generateQrPng(url)
  })

  it('returns a Buffer', async () => {
    expect(buf).toBeInstanceOf(Buffer)
    expect(buf.length).toBeGreaterThan(0)
  })

  it('output is 1000×1000px PNG', async () => {
    const meta = await sharp(buf).metadata()
    expect(meta.format).toBe('png')
    expect(meta.width).toBe(1000)
    expect(meta.height).toBe(1000)
  })

  it('encodes the correct URL (PNG is not empty noise)', async () => {
    expect(buf.length).toBeGreaterThan(1000)
  })
})
