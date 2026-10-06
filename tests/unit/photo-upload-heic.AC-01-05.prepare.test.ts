import { isHeicFile, ImagePreparationError, needsClientResize, prepareImageForUpload } from '@/shared/lib/prepare-image-upload'
import { ACCEPTED_IMAGE_INPUT, resolveUploadFormat } from '@/shared/lib/image-upload'

// Spec 085 — préparation des photos dans le navigateur.
const file = (name: string, type: string, size = 1000) => {
  const value = new File([new Uint8Array(1)], name, { type })
  Object.defineProperty(value, 'size', { value: size })
  return value
}

describe('085 AC-01 / AC-03 / AC-04 — HEIC', () => {
  it('reconnaît un HEIC par son type ou son extension', () => {
    expect(isHeicFile(file('IMG_1.HEIC', ''))).toBe(true)
    expect(isHeicFile(file('photo', 'image/heif'))).toBe(true)
    expect(isHeicFile(file('a.jpg', 'image/jpeg'))).toBe(false)
  })

  it('sélecteur et serveur acceptent HEIC/HEIF', () => {
    expect(ACCEPTED_IMAGE_INPUT).toContain('.heic')
    expect(ACCEPTED_IMAGE_INPUT).toContain('image/heic')
    expect(resolveUploadFormat('image/heic')).not.toBeNull()
    expect(resolveUploadFormat('image/heif')).not.toBeNull()
  })
})

describe('085 AC-02 — réduction', () => {
  it('au-delà de 2560 px ou de 3,5 Mo', () => {
    expect(needsClientResize({ width: 4032, height: 3024, size: 2_000_000 })).toBe(true)
    expect(needsClientResize({ width: 2000, height: 1500, size: 4_000_000 })).toBe(true)
    expect(needsClientResize({ width: 2000, height: 1500, size: 2_000_000 })).toBe(false)
  })
})

describe('085 — prepareImageForUpload', () => {
  const smallBitmap = { width: 1200, height: 800 }

  it('HEIC → converti en JPEG puis envoyé tel quel s’il est léger', async () => {
    const convertHeic = jest.fn(async () => new Blob([new Uint8Array(10)], { type: 'image/jpeg' }))
    const result = await prepareImageForUpload(file('IMG_1.HEIC', 'image/heic'), {
      convertHeic, decode: async () => smallBitmap, encode: jest.fn(),
    })
    expect(convertHeic).toHaveBeenCalled()
    expect(result.name).toBe('IMG_1.jpg')
    expect(result.type).toBe('image/jpeg')
  })

  it('photo lourde → réduite à 2560 px max en JPEG', async () => {
    const encode = jest.fn(async () => new Blob([new Uint8Array(5)], { type: 'image/jpeg' }))
    const result = await prepareImageForUpload(file('salon.jpg', 'image/jpeg', 6_000_000), {
      convertHeic: jest.fn(), decode: async () => ({ width: 4032, height: 3024 }), encode,
    })
    expect(encode).toHaveBeenCalledWith(expect.anything(), 2560, 1920)
    expect(result.name).toBe('salon.jpg')
    expect(result.size).toBe(5)
  })

  it('photo légère et petite → inchangée', async () => {
    const original = file('a.png', 'image/png', 100_000)
    const encode = jest.fn()
    expect(await prepareImageForUpload(original, { convertHeic: jest.fn(), decode: async () => smallBitmap, encode })).toBe(original)
    expect(encode).not.toHaveBeenCalled()
  })

  it('AC-05 : échec de conversion HEIC → message précis', async () => {
    await expect(prepareImageForUpload(file('x.heic', 'image/heic'), {
      convertHeic: async () => { throw new Error('boom') }, decode: async () => smallBitmap, encode: jest.fn(),
    })).rejects.toThrow(new ImagePreparationError('Impossible de convertir cette photo HEIC. Exportez-la en JPEG puis réessayez.'))
  })

  it('AC-05 : format non image → message précis', async () => {
    await expect(prepareImageForUpload(file('doc.pdf', 'application/pdf'), {
      convertHeic: jest.fn(), decode: async () => smallBitmap, encode: jest.fn(),
    })).rejects.toThrow('Format non pris en charge')
  })
})
