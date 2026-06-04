jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    qrCode: {
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    city: {
      findFirst: jest.fn(),
    },
  },
}))

import { prisma } from '@/shared/lib/prisma'
import { getQrCode, replaceCityQrCode } from '@/features/qr-code/queries/qr-code'
import { uploadQrToStorage } from '@/features/qr-code/services/upload-qr'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

const QR_ROW = {
  id: 'qr-1',
  city_id: 'city-1',
  lodging_id: null,
  url: 'https://example.com/guide/saint-gervais-les-bains',
  storage_url: 'https://supabase.co/storage/v1/object/public/qr-codes/saint-gervais-les-bains.png',
  created_at: new Date('2026-05-22T10:00:00Z'),
}

describe('getQrCode', () => {
  it('returns null when city not found', async () => {
    ;(mockPrisma.city.findFirst as jest.Mock).mockResolvedValue(null)
    const result = await getQrCode('unknown-city')
    expect(result).toBeNull()
  })

  it('returns null when no QrCode row for city', async () => {
    ;(mockPrisma.city.findFirst as jest.Mock).mockResolvedValue({ id: 'city-1', slug: 'saint-gervais-les-bains' })
    ;(mockPrisma.qrCode.findFirst as jest.Mock).mockResolvedValue(null)
    const result = await getQrCode('saint-gervais-les-bains')
    expect(result).toBeNull()
  })

  it('returns QrCodeResult when row found', async () => {
    ;(mockPrisma.city.findFirst as jest.Mock).mockResolvedValue({ id: 'city-1', slug: 'saint-gervais-les-bains' })
    ;(mockPrisma.qrCode.findFirst as jest.Mock).mockResolvedValue(QR_ROW)
    const result = await getQrCode('saint-gervais-les-bains')
    expect(result).toMatchObject({
      id: 'qr-1',
      city_slug: 'saint-gervais-les-bains',
      url: 'https://example.com/guide/saint-gervais-les-bains',
    })
  })
})

describe('replaceCityQrCode', () => {
  beforeEach(() => jest.clearAllMocks())

  it('hard-deletes any existing city-level QR codes, then creates a fresh one', async () => {
    ;(mockPrisma.qrCode.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })
    ;(mockPrisma.qrCode.create as jest.Mock).mockResolvedValue(QR_ROW)

    const result = await replaceCityQrCode(
      'city-1',
      'saint-gervais-les-bains',
      QR_ROW.url,
      QR_ROW.storage_url,
    )

    // Suppression dure des anciens QR ville (lodging_id = null), pas d'archivage
    expect(mockPrisma.qrCode.deleteMany).toHaveBeenCalledWith({
      where: { city_id: 'city-1', lodging_id: null },
    })
    // Création d'une nouvelle ligne (créée APRÈS la suppression)
    expect(mockPrisma.qrCode.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ city_id: 'city-1', is_active: true }),
      }),
    )
    const deleteOrder = (mockPrisma.qrCode.deleteMany as jest.Mock).mock.invocationCallOrder[0]
    const createOrder = (mockPrisma.qrCode.create as jest.Mock).mock.invocationCallOrder[0]
    expect(deleteOrder).toBeLessThan(createOrder)
    expect(result.city_slug).toBe('saint-gervais-les-bains')
  })
})

describe('uploadQrToStorage is exported', () => {
  it('is a function', () => {
    expect(typeof uploadQrToStorage).toBe('function')
  })
})
