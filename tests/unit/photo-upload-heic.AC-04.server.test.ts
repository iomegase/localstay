const mockHeicConvert = jest.fn()
jest.mock('heic-convert', () => ({ __esModule: true, default: (...args: unknown[]) => mockHeicConvert(...args) }))
const mockSharp = { rotate: jest.fn(), resize: jest.fn(), webp: jest.fn(), toBuffer: jest.fn() }
const sharpFactory = jest.fn((_input: Buffer) => mockSharp)
jest.mock('sharp', () => ({ __esModule: true, default: (input: Buffer) => sharpFactory(input) }))

import { decodeUploadInput } from '@/shared/lib/image-upload-service'

// Spec 085 AC-04 — HEIC reçu par le serveur.
describe('085 AC-04 — décodage HEIC côté serveur', () => {
  beforeEach(() => jest.clearAllMocks())

  it('HEIC → JPEG via heic-convert avant le réencodage', async () => {
    mockHeicConvert.mockResolvedValue(new Uint8Array([1, 2, 3]).buffer)
    const output = await decodeUploadInput(Buffer.from([9]), 'image/heic')
    expect(mockHeicConvert).toHaveBeenCalledWith({ buffer: Buffer.from([9]), format: 'JPEG', quality: 0.92 })
    expect(Buffer.from(output)).toEqual(Buffer.from([1, 2, 3]))
  })

  it('autres formats → inchangés', async () => {
    const input = Buffer.from([7])
    expect(await decodeUploadInput(input, 'image/jpeg')).toBe(input)
    expect(mockHeicConvert).not.toHaveBeenCalled()
  })
})
